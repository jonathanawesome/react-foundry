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

    expect(vite.optimizeDeps?.entries).toEqual([
      resolve(testRoot, 'src/**/*.preview.tsx'),
    ])
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

  it('writes the nav types into the project', async () => {
    mkdirSync(resolve(testRoot, 'src'), { recursive: true })
    await createViteConfig(config({ nav: [{ label: 'Forms' }] }), testRoot)

    expect(existsSync(resolve(testRoot, 'src', 'foundry-nav.gen.d.ts'))).toBe(true)
  })
})
