import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  findProvidersPath,
  generateProvidersModuleSource,
} from '../src/vite/providers-virtual-module-plugin'

describe('generateProvidersModuleSource', () => {
  it('emits a passthrough Provider when there is no consumer file', () => {
    const source = generateProvidersModuleSource(null)

    expect(source).toContain('export const Provider = ({ children }) => children')
    expect(source).not.toContain('import')
  })

  // A namespace import with a runtime fallback, not `export { Provider } from`, so a file
  // that exists but omits the export degrades to the passthrough instead of failing to build.
  it('re-exports the consumer Provider with a runtime fallback', () => {
    const source = generateProvidersModuleSource('/p/foundry.providers.tsx')

    expect(source).toContain('import * as _providers from "/p/foundry.providers.tsx"')
    expect(source).toContain(
      'export const Provider = _providers.Provider ?? (({ children }) => children)'
    )
  })

  // A backslash (Windows) or quote in the path would otherwise emit a broken module.
  it('escapes the path so a backslash or quote stays valid', () => {
    const win = generateProvidersModuleSource('C:\\proj\\foundry.providers.tsx')
    expect(win).toContain('"C:\\\\proj\\\\foundry.providers.tsx"')

    const quoted = generateProvidersModuleSource("/p/o'brien.providers.tsx")
    expect(quoted).toContain('import * as _providers from "/p/o\'brien.providers.tsx"')
  })

  // The passthrough must be valid JS. It carries no imports, so strip the export keyword
  // and parse the rest; a quoting break would throw here.
  it('produces a syntactically valid passthrough', () => {
    const body = generateProvidersModuleSource(null).replace(/^export /gm, '')

    expect(() => new Function(body)).not.toThrow()
  })
})

describe('findProvidersPath', () => {
  const root = resolve(tmpdir(), `react-foundry-providers-test-${process.pid}`)

  beforeEach(() => {
    mkdirSync(root, { recursive: true })
  })

  afterEach(() => {
    if (existsSync(root)) rmSync(root, { recursive: true })
  })

  it('returns null when the consumer has no providers file', () => {
    expect(findProvidersPath(root)).toBeNull()
  })

  it.each([
    'foundry.providers.tsx',
    'foundry.providers.jsx',
    'foundry.providers.ts',
    'foundry.providers.js',
  ])('finds a %s at the project root', (name) => {
    writeFileSync(
      resolve(root, name),
      'export const Provider = ({ children }) => children\n'
    )

    expect(findProvidersPath(root)).toBe(resolve(root, name))
  })

  // A consumer with both a compiled and a source file should get the source one.
  it('prefers .tsx over .js when both exist', () => {
    writeFileSync(resolve(root, 'foundry.providers.js'), '')
    writeFileSync(resolve(root, 'foundry.providers.tsx'), '')

    expect(findProvidersPath(root)).toBe(resolve(root, 'foundry.providers.tsx'))
  })
})
