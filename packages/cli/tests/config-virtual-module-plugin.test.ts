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
  it('writes empty defaults when no config provided', () => {
    const filePath = writeFoundryConfig({}, testCacheDir)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('export const themeColors = {"dark":{},"light":{}};')
    expect(content).toContain('export const foundryTitle = "";')
    expect(content).toContain('export const foundryNav = [];')
  })

  it('returns the absolute path to the generated file', () => {
    const filePath = writeFoundryConfig({}, testCacheDir)
    expect(filePath).toBe(resolve(testCacheDir, 'react-foundry-config.js'))
    expect(existsSync(filePath)).toBe(true)
  })

  it('serializes dark color overrides', () => {
    const filePath = writeFoundryConfig(
      { theme: { colors: { dark: { accent: '#0ea5e9', canvas: 'oklch(10% 0 0)' } } } },
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"dark":{"accent":"#0ea5e9","canvas":"oklch(10% 0 0)"}')
    expect(content).toContain('"light":{}')
  })

  it('serializes light color overrides', () => {
    const filePath = writeFoundryConfig(
      { theme: { colors: { light: { canvas: 'oklch(99% 0 0)' } } } },
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"light":{"canvas":"oklch(99% 0 0)"}')
    expect(content).toContain('"dark":{}')
  })

  it('serializes the title', () => {
    const filePath = writeFoundryConfig({ title: 'My Components' }, testCacheDir)
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('export const foundryTitle = "My Components";')
  })

  // Discovery runs in the browser, so the declared tree has to travel with the
  // rest of the runtime config rather than staying in the node process.
  it('serializes the nav tree so the browser can order the shelf', () => {
    const filePath = writeFoundryConfig(
      { nav: [{ label: 'Forms', children: [{ label: 'Button' }] }] },
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain(
      'export const foundryNav = [{"label":"Forms","children":[{"label":"Button"}]}];'
    )
  })

  it('preserves nav declaration order, which is display order', () => {
    const filePath = writeFoundryConfig(
      { nav: [{ label: 'Zulu' }, { label: 'Alpha' }] },
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('[{"label":"Zulu"},{"label":"Alpha"}]')
  })

  it('creates the cache directory if it does not exist', () => {
    expect(existsSync(testCacheDir)).toBe(false)
    writeFoundryConfig({}, testCacheDir)
    expect(existsSync(testCacheDir)).toBe(true)
  })

  it('overwrites existing file on subsequent calls', () => {
    writeFoundryConfig({ theme: { colors: { dark: { accent: 'old' } } } }, testCacheDir)
    const filePath = writeFoundryConfig(
      { theme: { colors: { dark: { accent: 'new' } } } },
      testCacheDir
    )
    const content = readFileSync(filePath, 'utf-8')
    expect(content).toContain('"accent":"new"')
    expect(content).not.toContain('"accent":"old"')
  })
})
