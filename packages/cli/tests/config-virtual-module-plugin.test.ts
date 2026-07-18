import { existsSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'

import { writeFoundryConfig } from '../src/vite/write-foundry-config'

const testCacheDir = resolve(tmpdir(), `react-foundry-test-${process.pid}`)

afterEach(() => {
  if (existsSync(testCacheDir)) {
    rmSync(testCacheDir, { recursive: true })
  }
})

describe('writeFoundryConfig', () => {
  it('writes empty dark/light objects and empty title when no config provided', () => {
    const filePath = writeFoundryConfig(undefined, undefined, testCacheDir)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('export const themeColors = {"dark":{},"light":{}};')
    expect(content).toContain('export const foundryTitle = "";')
  })

  it('returns the absolute path to the generated file', () => {
    const filePath = writeFoundryConfig(undefined, undefined, testCacheDir)
    expect(filePath).toBe(resolve(testCacheDir, 'react-foundry-config.js'))
    expect(existsSync(filePath)).toBe(true)
  })

  it('serializes dark color overrides', () => {
    const filePath = writeFoundryConfig(
      { colors: { dark: { brand: '#0ea5e9', neutral1: 'oklch(10% 0 0)' } } },
      undefined,
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"dark":{"brand":"#0ea5e9","neutral1":"oklch(10% 0 0)"}')
    expect(content).toContain('"light":{}')
  })

  it('serializes light color overrides', () => {
    const filePath = writeFoundryConfig(
      { colors: { light: { neutral1: 'oklch(99% 0 0)' } } },
      undefined,
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"light":{"neutral1":"oklch(99% 0 0)"}')
    expect(content).toContain('"dark":{}')
  })

  it('serializes the title', () => {
    const filePath = writeFoundryConfig(undefined, 'My Components', testCacheDir)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('export const foundryTitle = "My Components";')
  })

  it('creates the cache directory if it does not exist', () => {
    expect(existsSync(testCacheDir)).toBe(false)
    writeFoundryConfig(undefined, undefined, testCacheDir)
    expect(existsSync(testCacheDir)).toBe(true)
  })

  it('overwrites existing file on subsequent calls', () => {
    writeFoundryConfig({ colors: { dark: { brand: 'old' } } }, undefined, testCacheDir)
    const filePath = writeFoundryConfig(
      { colors: { dark: { brand: 'new' } } },
      undefined,
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"brand":"new"')
    expect(content).not.toContain('"brand":"old"')
  })
})
