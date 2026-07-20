import { existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { writeFoundryConfig } from '../src/vite/write-foundry-config'

const testCacheDir = resolve(tmpdir(), `react-foundry-test-${process.pid}`)

/** Runs writeFoundryConfig and returns the contents of both generated files. */
function write(config: Parameters<typeof writeFoundryConfig>[0]) {
  const { configPath, themePath } = writeFoundryConfig(config, testCacheDir)
  return {
    configPath,
    themePath,
    js: readFileSync(configPath, 'utf-8'),
    css: readFileSync(themePath, 'utf-8'),
  }
}

afterEach(() => {
  if (existsSync(testCacheDir)) {
    rmSync(testCacheDir, { recursive: true })
  }
})

describe('writeFoundryConfig', () => {
  it('returns the absolute paths to both generated files', () => {
    const { configPath, themePath } = writeFoundryConfig({}, testCacheDir)
    expect(configPath).toBe(resolve(testCacheDir, 'react-foundry-config.js'))
    expect(themePath).toBe(resolve(testCacheDir, 'foundry-theme.css'))
    expect(existsSync(configPath)).toBe(true)
    expect(existsSync(themePath)).toBe(true)
  })

  it('creates the cache directory if it does not exist', () => {
    expect(existsSync(testCacheDir)).toBe(false)
    writeFoundryConfig({}, testCacheDir)
    expect(existsSync(testCacheDir)).toBe(true)
  })

  describe('the config module (title + nav)', () => {
    it('writes empty defaults when no config is provided', () => {
      const { js } = write({})
      expect(js).toContain('export const foundryTitle = "";')
      expect(js).toContain('export const foundryNav = [];')
      // Colors are no longer part of the JS module; they go to the CSS sheet.
      expect(js).not.toContain('themeColors')
    })

    it('serializes the title', () => {
      expect(write({ title: 'My Components' }).js).toContain(
        'export const foundryTitle = "My Components";'
      )
    })

    it('serializes the nav tree in declaration (display) order', () => {
      const { js } = write({ nav: [{ label: 'Zulu' }, { label: 'Alpha' }] })
      expect(js).toContain(
        'export const foundryNav = [{"label":"Zulu"},{"label":"Alpha"}];'
      )
    })
  })

  describe('the theme override sheet', () => {
    it('is empty when no theme is configured', () => {
      expect(write({}).css).toBe('')
    })

    it('emits per-mode color overrides as contract CSS variables', () => {
      const { css } = write({
        theme: { colors: { dark: { accent: '#0ea5e9', canvas: '#111' } } },
      })
      expect(css).toContain('html.foundry-dark {')
      expect(css).toContain('--foundry-colors-accent: #0ea5e9;')
      expect(css).toContain('--foundry-colors-canvas: #111;')
      // No light block when only dark is overridden.
      expect(css).not.toContain('html.foundry-light {')
    })

    it('kebab-cases camelCase token names into the var name', () => {
      const { css } = write({ theme: { colors: { light: { textMuted: '#777' } } } })
      expect(css).toContain('html.foundry-light {')
      expect(css).toContain('--foundry-colors-text-muted: #777;')
    })

    it('wraps a bare OKLCH triplet in oklch()', () => {
      const { css } = write({
        theme: { colors: { light: { accent: '62.1% 0.289 350.9' } } },
      })
      expect(css).toContain('--foundry-colors-accent: oklch(62.1% 0.289 350.9);')
    })

    it('emits font overrides into both mode blocks (mode-agnostic)', () => {
      const { css } = write({ theme: { fonts: { sans: 'Inter, sans-serif' } } })
      const blocks = css.match(/--foundry-fonts-sans: Inter, sans-serif;/g) ?? []
      expect(blocks).toHaveLength(2)
      expect(css).toContain('html.foundry-light {')
      expect(css).toContain('html.foundry-dark {')
    })

    it('drops keys that are not overridable tokens', () => {
      const { css } = write({
        theme: {
          // stateHover is a real contract token but intentionally not overridable.
          colors: { dark: { canvas: '#111', stateHover: '#222' } as never },
        },
      })
      expect(css).toContain('--foundry-colors-canvas: #111;')
      expect(css).not.toContain('state-hover')
    })
  })

  it('overwrites both files on subsequent calls', () => {
    writeFoundryConfig({ theme: { colors: { dark: { accent: '#old' } } } }, testCacheDir)
    const { css } = write({ theme: { colors: { dark: { accent: '#new' } } } })
    expect(css).toContain('--foundry-colors-accent: #new;')
    expect(css).not.toContain('#old')
  })
})
