import { existsSync, mkdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG } from '../src/config/defaults'
import type { ResolvedFoundryConfig } from '../src/types'
import { createViteConfig } from '../src/vite/create-config'

const testRoot = resolve(tmpdir(), `react-foundry-config-test-${process.pid}`)

function config(overrides: Partial<ResolvedFoundryConfig> = {}): ResolvedFoundryConfig {
  return { ...DEFAULT_CONFIG, viteConfig: {}, ...overrides }
}

beforeEach(() => {
  mkdirSync(testRoot, { recursive: true })
})

afterEach(() => {
  if (existsSync(testRoot)) rmSync(testRoot, { recursive: true })
})

describe('createViteConfig', () => {
  it('aliases the config virtual module at the generated file', () => {
    const vite = createViteConfig(config(), testRoot)
    const alias = vite.resolve?.alias as Record<string, string>

    expect(alias['virtual:react-foundry-config']).toContain('react-foundry-config.js')
  })

  it('excludes the generated config from dependency optimization', () => {
    const vite = createViteConfig(config(), testRoot)

    expect(vite.optimizeDeps?.exclude).toContain('virtual:react-foundry-config')
  })

  it('ignores the user project in the watcher', () => {
    const vite = createViteConfig(config(), testRoot)

    expect(vite.server?.watch?.ignored).toEqual([`${testRoot}/**/*`])
  })

  it('normalizes a leading ./ in the previews glob', () => {
    const vite = createViteConfig(
      config({ previews: './src/**/*.preview.tsx' }),
      testRoot
    )

    expect(vite.optimizeDeps?.entries).toEqual([
      resolve(testRoot, 'src/**/*.preview.tsx'),
    ])
  })

  describe('user vite overrides', () => {
    // A user setting any server key used to replace the whole server block,
    // dropping watch.ignored and breaking the previews and config watchers.
    it('keeps watch.ignored when the user sets an unrelated server key', () => {
      const vite = createViteConfig(
        config({ viteConfig: { server: { host: '0.0.0.0' } } }),
        testRoot
      )

      expect(vite.server?.watch?.ignored).toEqual([`${testRoot}/**/*`])
      expect(vite.server?.host).toBe('0.0.0.0')
    })

    it('keeps fs.allow when the user sets an unrelated server key', () => {
      const vite = createViteConfig(
        config({ viteConfig: { server: { open: true } } }),
        testRoot
      )

      expect(vite.server?.fs?.allow).toBeDefined()
      expect(vite.server?.fs?.strict).toBe(false)
    })

    it('lets the user override watch.ignored explicitly', () => {
      const vite = createViteConfig(
        config({ viteConfig: { server: { watch: { ignored: ['custom'] } } } }),
        testRoot
      )

      expect(vite.server?.watch?.ignored).toEqual(['custom'])
    })

    it('keeps the optimizeDeps exclusion when the user sets other optimizeDeps keys', () => {
      const vite = createViteConfig(
        config({ viteConfig: { optimizeDeps: { force: true } } }),
        testRoot
      )

      expect(vite.optimizeDeps?.exclude).toContain('virtual:react-foundry-config')
      expect(vite.optimizeDeps?.force).toBe(true)
    })

    it('keeps the build outDir when the user sets other build keys', () => {
      const vite = createViteConfig(
        config({ viteConfig: { build: { sourcemap: true } } }),
        testRoot
      )

      expect(vite.build?.outDir).toBe(resolve(testRoot, 'dist'))
      expect(vite.build?.sourcemap).toBe(true)
    })

    it('appends user plugins after the foundry plugins', () => {
      const marker = { name: 'user-plugin' }
      const vite = createViteConfig(
        config({ viteConfig: { plugins: [marker] } }),
        testRoot
      )

      const plugins = vite.plugins ?? []
      expect(plugins[plugins.length - 1]).toBe(marker)
    })

    it('keeps the config alias when the user supplies their own aliases', () => {
      const vite = createViteConfig(
        config({ viteConfig: { resolve: { alias: { '@app': '/somewhere' } } } }),
        testRoot
      )
      const alias = vite.resolve?.alias as Record<string, string>

      expect(alias['@app']).toBe('/somewhere')
      expect(alias['virtual:react-foundry-config']).toBeDefined()
    })
  })

  it('writes the nav types into the project', () => {
    mkdirSync(resolve(testRoot, 'src'), { recursive: true })
    createViteConfig(config({ nav: [{ label: 'Forms' }] }), testRoot)

    expect(existsSync(resolve(testRoot, 'src', 'foundry-nav.gen.d.ts'))).toBe(true)
  })
})
