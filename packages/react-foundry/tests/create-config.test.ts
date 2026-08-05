import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import type { Alias } from 'vite'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG } from '../src/config/defaults'
import type { ResolvedFoundryConfig } from '../src/types'
import { createViteConfig } from '../src/vite/create-config'

const testRoot = resolve(tmpdir(), `react-foundry-config-test-${process.pid}`)

function config(overrides: Partial<ResolvedFoundryConfig> = {}): ResolvedFoundryConfig {
  return { ...DEFAULT_CONFIG, viteConfig: {}, ...overrides }
}

/** The alias is an array of `{ find, replacement }`; look one up by its `find`. */
function aliasFor(
  vite: { resolve?: { alias?: unknown } },
  find: string
): string | undefined {
  const alias = (vite.resolve?.alias ?? []) as Alias[]
  return alias.find((a) => a.find === find)?.replacement
}

/** Collects plugin names, flattening the nested arrays plugins like `react()` return. */
function pluginNames(plugins: unknown): string[] {
  const names: string[] = []
  const walk = (plugin: unknown) => {
    if (Array.isArray(plugin)) plugin.forEach(walk)
    else if (plugin && typeof plugin === 'object' && 'name' in plugin) {
      names.push((plugin as { name: string }).name)
    }
  }
  walk(plugins)
  return names
}

// Exercise the published-package wiring (strict fs, client aliases, no dev plugins),
// which is what ships. FOUNDRY_DEV_SOURCE=0 forces it regardless of the .ts test runner.
let prevDevSource: string | undefined

beforeEach(() => {
  prevDevSource = process.env.FOUNDRY_DEV_SOURCE
  process.env.FOUNDRY_DEV_SOURCE = '0'
  mkdirSync(testRoot, { recursive: true })
})

afterEach(() => {
  process.env.FOUNDRY_DEV_SOURCE = prevDevSource
  if (existsSync(testRoot)) rmSync(testRoot, { recursive: true })
})

describe('createViteConfig', () => {
  it('aliases the config virtual module at the generated file', async () => {
    const vite = await createViteConfig(config(), testRoot)
    expect(aliasFor(vite, 'virtual:react-foundry-config')).toContain(
      'react-foundry-config.js'
    )
  })

  it('excludes the generated config from dependency optimization', async () => {
    const vite = await createViteConfig(config(), testRoot)
    expect(vite.optimizeDeps?.exclude).toContain('virtual:react-foundry-config')
  })

  it('registers the providers virtual module plugin', async () => {
    const vite = await createViteConfig(config(), testRoot)

    expect(pluginNames(vite.plugins)).toContain('react-foundry:virtual-providers')
  })

  it('keeps the providers plugin when the user supplies their own plugins', async () => {
    const vite = await createViteConfig(
      config({ viteConfig: { plugins: [{ name: 'user-plugin' }] } }),
      testRoot
    )

    expect(pluginNames(vite.plugins)).toContain('react-foundry:virtual-providers')
  })

  it('ignores the user project in the watcher', async () => {
    const vite = await createViteConfig(config(), testRoot)
    expect(vite.server?.watch?.ignored).toEqual([`${testRoot}/**/*`])
  })

  it('serves the user project under a strict fs allow-list', async () => {
    const vite = await createViteConfig(config(), testRoot)
    expect(vite.server?.fs?.strict).toBe(true)
    expect(vite.server?.fs?.allow).toContain(testRoot)
  })

  it('normalizes a leading ./ in the previews glob', async () => {
    const vite = await createViteConfig(
      config({ previews: './src/**/*.preview.tsx' }),
      testRoot
    )

    const entries = vite.optimizeDeps?.entries as string[]
    expect(entries).toContain(resolve(testRoot, 'src/**/*.preview.tsx'))
  })

  it('scans foundry’s own app entry so its runtime deps are discovered', async () => {
    const vite = await createViteConfig(config(), testRoot)

    const entries = vite.optimizeDeps?.entries as string[]
    // The app entry must come first so foundry's shell is scanned, not only the previews.
    expect(entries[0]?.endsWith('app/index.html')).toBe(true)
  })

  it('dedupes and pre-bundles foundry’s shared runtime', async () => {
    const vite = await createViteConfig(config(), testRoot)

    expect(vite.resolve?.dedupe).toEqual(['react', 'react-dom'])
    expect(vite.optimizeDeps?.include).toEqual(
      expect.arrayContaining([
        'react-dom/client',
        'react/jsx-runtime',
        'use-sync-external-store/shim/with-selector',
      ])
    )
  })

  // Dedupe resolves a bare id from Vite root, which sits inside the installed package, so
  // listing one of foundry's own dependencies overrides the consumer's copy of it. The
  // router was the case that mattered: a previewed component calling `useParams()` would
  // bind to foundry's provider and read the shell's splat params instead of throwing.
  it('claims nothing beyond the react peers', async () => {
    const vite = await createViteConfig(config(), testRoot)

    expect(vite.resolve?.dedupe).not.toContain('@tanstack/react-router')
    expect(vite.optimizeDeps?.include).not.toContain('@tanstack/react-router')
  })

  describe('user vite overrides', () => {
    it('keeps watch.ignored when the user sets an unrelated server key', async () => {
      const vite = await createViteConfig(
        config({ viteConfig: { server: { host: '0.0.0.0' } } }),
        testRoot
      )

      expect(vite.server?.watch?.ignored).toEqual([`${testRoot}/**/*`])
      expect(vite.server?.host).toBe('0.0.0.0')
    })

    it('keeps fs.allow when the user sets an unrelated server key', async () => {
      const vite = await createViteConfig(
        config({ viteConfig: { server: { open: true } } }),
        testRoot
      )

      expect(vite.server?.fs?.allow).toBeDefined()
      expect(vite.server?.fs?.strict).toBe(true)
    })

    it('lets the user override watch.ignored explicitly', async () => {
      const vite = await createViteConfig(
        config({ viteConfig: { server: { watch: { ignored: ['custom'] } } } }),
        testRoot
      )

      expect(vite.server?.watch?.ignored).toEqual(['custom'])
    })

    it('keeps the optimizeDeps exclusion when the user sets other optimizeDeps keys', async () => {
      const vite = await createViteConfig(
        config({ viteConfig: { optimizeDeps: { force: true } } }),
        testRoot
      )

      expect(vite.optimizeDeps?.exclude).toContain('virtual:react-foundry-config')
      expect(vite.optimizeDeps?.force).toBe(true)
    })

    it('merges user optimizeDeps include/entries with foundry’s, not replacing them', async () => {
      const vite = await createViteConfig(
        config({
          viteConfig: {
            optimizeDeps: {
              include: ['my-lib'],
              entries: 'extra/**/*.tsx',
            },
          },
        }),
        testRoot
      )

      expect(vite.optimizeDeps?.include).toEqual(
        expect.arrayContaining(['react-dom/client', 'my-lib'])
      )
      const entries = vite.optimizeDeps?.entries as string[]
      expect(entries[0]?.endsWith('app/index.html')).toBe(true)
      expect(entries).toContain('extra/**/*.tsx')
    })

    it('merges user resolve.dedupe with foundry’s', async () => {
      const vite = await createViteConfig(
        config({ viteConfig: { resolve: { dedupe: ['my-lib'] } } }),
        testRoot
      )

      expect(vite.resolve?.dedupe).toEqual(
        expect.arrayContaining(['react', 'react-dom', 'my-lib'])
      )
    })

    it('keeps the build outDir when the user sets other build keys', async () => {
      const vite = await createViteConfig(
        config({ viteConfig: { build: { sourcemap: true } } }),
        testRoot
      )

      expect(vite.build?.outDir).toBe(resolve(testRoot, 'dist'))
      expect(vite.build?.sourcemap).toBe(true)
    })

    it('appends user plugins after the foundry plugins', async () => {
      const marker = { name: 'user-plugin' }
      const vite = await createViteConfig(
        config({ viteConfig: { plugins: [marker] } }),
        testRoot
      )

      const plugins = vite.plugins ?? []
      expect(plugins[plugins.length - 1]).toBe(marker)
    })

    it('keeps the config alias when the user supplies their own aliases', async () => {
      const vite = await createViteConfig(
        config({ viteConfig: { resolve: { alias: { '@app': '/somewhere' } } } }),
        testRoot
      )

      expect(aliasFor(vite, '@app')).toBe('/somewhere')
      expect(aliasFor(vite, 'virtual:react-foundry-config')).toBeDefined()
    })
  })

  describe('the generated nav types', () => {
    const generated = () => resolve(testRoot, 'src', 'foundry-nav.gen.d.ts')

    it('are written into the project', async () => {
      mkdirSync(resolve(testRoot, 'src'), { recursive: true })
      await createViteConfig(config({ nav: [{ label: 'Forms' }] }), testRoot)

      expect(existsSync(generated())).toBe(true)
    })

    // The opt-out for projects deriving the union with `defineNav` + `NavPathsOf`, which
    // needs no generated file at all.
    it('are not written when navTypes is false', async () => {
      mkdirSync(resolve(testRoot, 'src'), { recursive: true })
      await createViteConfig(
        config({ nav: [{ label: 'Forms' }], navTypes: false }),
        testRoot
      )

      expect(existsSync(generated())).toBe(false)
    })

    // Switching the flag off has to clear the artifact too, or a union nothing
    // regenerates outlives the setting that produced it.
    it('are removed when navTypes is turned off after a run that wrote them', async () => {
      mkdirSync(resolve(testRoot, 'src'), { recursive: true })
      await createViteConfig(config({ nav: [{ label: 'Forms' }] }), testRoot)
      expect(existsSync(generated())).toBe(true)

      await createViteConfig(
        config({ nav: [{ label: 'Forms' }], navTypes: false }),
        testRoot
      )

      expect(existsSync(generated())).toBe(false)
    })
  })
})
