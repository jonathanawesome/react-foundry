import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { loadConfig } from '../src/config/load-config'

let tempDir: string

beforeEach(() => {
  tempDir = mkdtempSync(join(tmpdir(), `foundry-test-${Date.now()}-`))
})

afterEach(() => {
  rmSync(tempDir, { recursive: true })
})

/** Helper to write a .mjs config file */
function writeConfig(dir: string, fileName: string, content: string) {
  const filePath = resolve(dir, fileName)
  writeFileSync(filePath, content, 'utf-8')
}

describe('loadConfig', () => {
  it('returns defaults when no config file exists', async () => {
    const config = await loadConfig(tempDir)
    expect(config.previews).toBe('src/components/**/*.preview.tsx')
    expect(config.port).toBe(5173)
    expect(config.host).toBe('localhost')
    expect(config.viteConfig).toEqual({})
  })

  it('merges user config with defaults', async () => {
    writeConfig(tempDir, 'foundry.config.mjs', `export default { port: 9000 };\n`)
    const config = await loadConfig(tempDir)
    expect(config.port).toBe(9000)
    expect(config.previews).toBe('src/components/**/*.preview.tsx')
    expect(config.host).toBe('localhost')
  })

  it('preserves theme config through merge', async () => {
    writeConfig(
      tempDir,
      'foundry.config.mjs',
      `export default {
        theme: { colors: { dark: { accent: '50% 0.3 270' } } }
      };\n`
    )
    const config = await loadConfig(tempDir)
    expect(config.theme?.colors?.dark?.accent).toBe('50% 0.3 270')
  })

  it('preserves title through merge', async () => {
    writeConfig(
      tempDir,
      'foundry.config.mjs',
      `export default { title: 'My Components' };\n`
    )
    const config = await loadConfig(tempDir)
    expect(config.title).toBe('My Components')
  })

  it('loads .mjs with highest priority when multiple files exist', async () => {
    writeConfig(tempDir, 'foundry.config.mjs', `export default { port: 1111 };\n`)
    // Also write a package.json so .js is valid ESM
    writeConfig(tempDir, 'package.json', `{"type":"module"}\n`)
    writeConfig(tempDir, 'foundry.config.js', `export default { port: 2222 };\n`)
    const config = await loadConfig(tempDir)
    expect(config.port).toBe(1111)
  })

  it('falls back to .js when .mjs does not exist', async () => {
    writeConfig(tempDir, 'package.json', `{"type":"module"}\n`)
    writeConfig(tempDir, 'foundry.config.js', `export default { port: 3333 };\n`)
    const config = await loadConfig(tempDir)
    expect(config.port).toBe(3333)
  })

  it('loads from .foundry/ subdirectory', async () => {
    const foundryDir = resolve(tempDir, '.foundry')
    mkdirSync(foundryDir)
    writeConfig(foundryDir, 'config.mjs', `export default { port: 4444 };\n`)
    const config = await loadConfig(tempDir)
    expect(config.port).toBe(4444)
  })

  it('prefers root-level config over .foundry/ subdirectory', async () => {
    writeConfig(tempDir, 'foundry.config.mjs', `export default { port: 5555 };\n`)
    const foundryDir = resolve(tempDir, '.foundry')
    mkdirSync(foundryDir)
    writeConfig(foundryDir, 'config.mjs', `export default { port: 6666 };\n`)
    const config = await loadConfig(tempDir)
    expect(config.port).toBe(5555)
  })

  it('provides viteConfig as empty object when not specified', async () => {
    writeConfig(tempDir, 'foundry.config.mjs', `export default { port: 7777 };\n`)
    const config = await loadConfig(tempDir)
    expect(config.viteConfig).toEqual({})
  })

  it('handles config file that exports empty object', async () => {
    writeConfig(tempDir, 'foundry.config.mjs', `export default {};\n`)
    const config = await loadConfig(tempDir)
    expect(config.previews).toBe('src/components/**/*.preview.tsx')
    expect(config.port).toBe(5173)
    expect(config.host).toBe('localhost')
    expect(config.viteConfig).toEqual({})
  })

  it('handles config file with no default export gracefully', async () => {
    writeConfig(tempDir, 'foundry.config.mjs', `export const port = 9999;\n`)
    const config = await loadConfig(tempDir)
    // No default export → userConfig falls back to {}
    expect(config.port).toBe(5173)
    expect(config.previews).toBe('src/components/**/*.preview.tsx')
  })
})
