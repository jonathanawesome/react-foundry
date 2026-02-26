import { existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { writeThemeConfig } from '../src/vite/write-theme-config'

const testCacheDir = resolve(tmpdir(), `react-foundry-test-${process.pid}`)

afterEach(() => {
  if (existsSync(testCacheDir)) {
    rmSync(testCacheDir, { recursive: true })
  }
})

describe('writeThemeConfig', () => {
  it('writes empty dark/light objects when no theme provided', () => {
    const filePath = writeThemeConfig(undefined, testCacheDir)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toBe('export const themeColors = {"dark":{},"light":{}};\n')
  })

  it('returns the absolute path to the generated file', () => {
    const filePath = writeThemeConfig(undefined, testCacheDir)
    expect(filePath).toBe(resolve(testCacheDir, 'react-foundry-config.js'))
    expect(existsSync(filePath)).toBe(true)
  })

  it('serializes dark color overrides', () => {
    const filePath = writeThemeConfig(
      { colors: { dark: { brand: '#0ea5e9', bg: 'oklch(10% 0 0)' } } },
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"dark":{"brand":"#0ea5e9","bg":"oklch(10% 0 0)"}')
    expect(content).toContain('"light":{}')
  })

  it('serializes light color overrides', () => {
    const filePath = writeThemeConfig(
      { colors: { light: { surface: 'oklch(99% 0 0)' } } },
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"light":{"surface":"oklch(99% 0 0)"}')
    expect(content).toContain('"dark":{}')
  })

  it('creates the cache directory if it does not exist', () => {
    expect(existsSync(testCacheDir)).toBe(false)
    writeThemeConfig(undefined, testCacheDir)
    expect(existsSync(testCacheDir)).toBe(true)
  })

  it('overwrites existing file on subsequent calls', () => {
    writeThemeConfig({ colors: { dark: { brand: 'old' } } }, testCacheDir)
    const filePath = writeThemeConfig({ colors: { dark: { brand: 'new' } } }, testCacheDir)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"brand":"new"')
    expect(content).not.toContain('"brand":"old"')
  })
})
