import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  utimesSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { ViteDevServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  applyConfigChange,
  configModulePath,
  readSeedConfigSource,
} from '../src/vite/config-hmr-plugin'

let userRoot: string
let cacheDir: string
let mtimeTick: number

beforeEach(() => {
  userRoot = mkdtempSync(join(tmpdir(), `foundry-hmr-${process.pid}-`))
  cacheDir = resolve(userRoot, 'node_modules', '.cache', 'react-foundry')
  mtimeTick = 0
  mkdirSync(resolve(userRoot, 'src'), { recursive: true })
})

afterEach(() => {
  rmSync(userRoot, { recursive: true, force: true })
})

/**
 * Writes the user's config and returns its path.
 *
 * The mtime is advanced by hand on every write. `importUserConfig` stamps it into the
 * bundled filename to bust the ESM module cache, so two writes landing in the same
 * millisecond would re-import the first one's bundle and the second edit would vanish.
 */
function writeConfig(source: string): string {
  const configPath = resolve(userRoot, 'foundry.config.mjs')
  writeFileSync(configPath, source, 'utf-8')

  mtimeTick += 1
  const stamp = new Date(Date.now() + mtimeTick * 1000)
  utimesSync(configPath, stamp, stamp)

  return configPath
}

/**
 * A dev server just real enough for the reload path: a module graph that can be asked
 * for a file, a socket that records what the browser was told, and a watcher that
 * records which emitted files went through Vite's own HMR pipeline.
 */
function fakeServer(modules: Record<string, { importers?: string[] }> = {}) {
  const invalidated: string[] = []
  const sent: unknown[] = []
  const emitted: string[] = []

  const byId = new Map<string, { id: string; importers: Set<unknown> }>()
  for (const id of Object.keys(modules)) byId.set(id, { id, importers: new Set() })
  for (const [id, { importers = [] }] of Object.entries(modules)) {
    for (const importer of importers) byId.get(id)?.importers.add(byId.get(importer))
  }

  const server = {
    moduleGraph: {
      getModuleById: (id: string) => byId.get(id),
      getModulesByFile: (file: string) => {
        const mod = byId.get(file)
        return mod ? new Set([mod]) : undefined
      },
      invalidateModule: (mod: { id: string }) => invalidated.push(mod.id),
    },
    ws: { send: (payload: unknown) => sent.push(payload) },
    watcher: { emit: (_event: string, file: string) => emitted.push(file) },
  } as unknown as ViteDevServer

  return { server, invalidated, sent, emitted }
}

const navTypesFile = () => resolve(userRoot, 'src', 'foundry-nav.gen.d.ts')

describe('readSeedConfigSource', () => {
  // Without the seed every first edit would look like a change and force a reload, even
  // when only a color moved.
  it('returns null before the config module has been written', () => {
    expect(readSeedConfigSource(cacheDir)).toBeNull()
  })

  it('reads back what a previous write left', async () => {
    const configPath = writeConfig(`export default { title: 'Seed' }\n`)
    const { server } = fakeServer()

    await applyConfigChange(server, {
      configPath,
      userRoot,
      cacheDir,
      lastConfigSource: null,
    })

    expect(readSeedConfigSource(cacheDir)).toContain('Seed')
  })
})

describe('applyConfigChange', () => {
  it('regenerates the config module from the edited config', async () => {
    const configPath = writeConfig(
      `export default { title: 'Warm', nav: [{ label: 'Forms' }] }\n`
    )
    const { server } = fakeServer()

    const result = await applyConfigChange(server, {
      configPath,
      userRoot,
      cacheDir,
      lastConfigSource: null,
    })

    expect(result.configSource).toContain('export const foundryTitle = "Warm";')
    expect(result.configSource).toContain('{"label":"Forms"}')
    expect(existsSync(configModulePath(cacheDir))).toBe(true)
  })

  // The bug this whole path exists for: `discoverNav` builds at module scope and memoizes,
  // so an HMR update alone left the shelf rendering the previous tree until a restart.
  describe('when nav or title changed', () => {
    it('drops the config module and tells the browser to reload', async () => {
      const configPath = writeConfig(`export default { nav: [{ label: 'Forms' }] }\n`)
      const { server, invalidated, sent } = fakeServer({
        [configModulePath(cacheDir)]: {},
      })

      const result = await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: 'something else entirely',
      })

      expect(result.reloaded).toBe(true)
      expect(result.dropped).toBe(1)
      expect(invalidated).toEqual([configModulePath(cacheDir)])
      expect(sent).toEqual([{ type: 'full-reload' }])
    })

    // app/nav.ts imports the config module and memoizes the tree it builds, so leaving
    // that importer cached serves the old shelf even across a refresh.
    it('drops the importers that memoize the tree', async () => {
      const configPath = writeConfig(`export default { nav: [{ label: 'Forms' }] }\n`)
      const { server, invalidated } = fakeServer({
        [configModulePath(cacheDir)]: { importers: ['/app/nav.ts'] },
        '/app/nav.ts': { importers: ['/app/root-route.tsx'] },
        '/app/root-route.tsx': {},
      })

      const result = await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: null,
      })

      expect(result.dropped).toBe(3)
      expect(invalidated).toContain('/app/nav.ts')
      expect(invalidated).toContain('/app/root-route.tsx')
    })
  })

  // Tuning colors is the common case, and a full reload there would be a worse experience
  // than the CSS hot-swap Vite already gives us.
  // Tuning colors is the common case, and a full reload there would be a worse experience
  // than the CSS hot-swap Vite already gives us. The config module carries only title and
  // nav, so a theme-only edit leaves it byte-identical: that is the whole discriminator.
  describe('when only the theme changed', () => {
    /** Applies an edit that moves the accent and nothing else. */
    async function editTheThemeOnly() {
      let configPath = writeConfig(
        `export default {
           title: 'Same', nav: [{ label: 'Forms' }],
           theme: { colors: { dark: { accent: '#111111' } } },
         }\n`
      )
      const { server } = fakeServer({ [configModulePath(cacheDir)]: {} })

      const first = await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: null,
      })

      configPath = writeConfig(
        `export default {
           title: 'Same', nav: [{ label: 'Forms' }],
           theme: { colors: { dark: { accent: '#222222' } } },
         }\n`
      )
      const next = fakeServer({ [configModulePath(cacheDir)]: {} })
      const result = await applyConfigChange(next.server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: first.configSource,
      })

      return { ...next, result }
    }

    it('leaves the page alone', async () => {
      const { result, invalidated, sent } = await editTheThemeOnly()

      expect(result.reloaded).toBe(false)
      expect(result.dropped).toBe(0)
      expect(invalidated).toEqual([])
      expect(sent).toEqual([])
    })

    it('still hands the regenerated sheet to Vite so the CSS hot-swaps', async () => {
      const { emitted } = await editTheThemeOnly()

      expect(emitted).toEqual([resolve(cacheDir, 'foundry-theme.css')])
      expect(readFileSync(resolve(cacheDir, 'foundry-theme.css'), 'utf-8')).toContain(
        '#222222'
      )
    })

    // The counterpart: the same edit shape but touching `title` does reload, which is
    // what proves the two tests above are not just asserting "nothing ever reloads".
    it('reloads when the same edit also moves the title', async () => {
      let configPath = writeConfig(
        `export default { title: 'Before', theme: { colors: { dark: { accent: '#111111' } } } }\n`
      )
      const { server } = fakeServer({ [configModulePath(cacheDir)]: {} })

      const first = await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: null,
      })

      configPath = writeConfig(
        `export default { title: 'After', theme: { colors: { dark: { accent: '#222222' } } } }\n`
      )
      const { server: second, sent } = fakeServer({ [configModulePath(cacheDir)]: {} })
      const result = await applyConfigChange(second, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: first.configSource,
      })

      expect(result.reloaded).toBe(true)
      expect(sent).toEqual([{ type: 'full-reload' }])
    })
  })

  describe('the generated nav types', () => {
    it('are rewritten alongside the shelf, so the union never lags it', async () => {
      const configPath = writeConfig(`export default { nav: [{ label: 'Forms' }] }\n`)
      const { server } = fakeServer()

      const result = await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: null,
      })

      expect(result.navTypesPath).toBe(navTypesFile())
      expect(existsSync(navTypesFile())).toBe(true)
    })

    it('are not written when navTypes is false', async () => {
      const configPath = writeConfig(
        `export default { nav: [{ label: 'Forms' }], navTypes: false }\n`
      )
      const { server } = fakeServer()

      const result = await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: null,
      })

      expect(result.navTypesPath).toBeNull()
      expect(existsSync(navTypesFile())).toBe(false)
    })

    // Turning the flag off mid-session has to clear the artifact, or a union nothing
    // regenerates outlives the setting that produced it.
    it('are removed when navTypes is turned off in an edit', async () => {
      let configPath = writeConfig(`export default { nav: [{ label: 'Forms' }] }\n`)
      const { server } = fakeServer()

      const first = await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: null,
      })
      expect(existsSync(navTypesFile())).toBe(true)

      configPath = writeConfig(
        `export default { nav: [{ label: 'Forms' }], navTypes: false }\n`
      )
      const result = await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: first.configSource,
      })

      expect(result.navTypesPath).toBeNull()
      expect(existsSync(navTypesFile())).toBe(false)
    })

    it('are removed when the nav tree is emptied in an edit', async () => {
      let configPath = writeConfig(`export default { nav: [{ label: 'Forms' }] }\n`)
      const { server } = fakeServer()

      await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: null,
      })
      expect(existsSync(navTypesFile())).toBe(true)

      configPath = writeConfig(`export default { nav: [] }\n`)
      await applyConfigChange(server, {
        configPath,
        userRoot,
        cacheDir,
        lastConfigSource: null,
      })

      expect(existsSync(navTypesFile())).toBe(false)
    })
  })
})
