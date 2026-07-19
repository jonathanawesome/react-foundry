import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import type { NavItem } from '../src/types'
import {
  flattenNavPaths,
  resolveNavTypesPath,
  writeNavTypes,
} from '../src/vite/write-nav-types'

const testRoot = resolve(tmpdir(), `react-foundry-nav-test-${process.pid}`)

beforeEach(() => {
  mkdirSync(testRoot, { recursive: true })
})

afterEach(() => {
  if (existsSync(testRoot)) {
    rmSync(testRoot, { recursive: true })
  }
})

describe('flattenNavPaths', () => {
  it('returns nothing for an absent tree', () => {
    expect(flattenNavPaths(undefined)).toEqual([])
  })

  it('returns nothing for an empty tree', () => {
    expect(flattenNavPaths([])).toEqual([])
  })

  it('emits top level labels as paths', () => {
    expect(flattenNavPaths([{ label: 'Forms' }, { label: 'Layout' }])).toEqual([
      'Forms',
      'Layout',
    ])
  })

  // Parents are addressable too, so a preview can sit directly on 'Forms'.
  it('emits the parent path as well as its children', () => {
    const nav: NavItem[] = [
      { label: 'Forms', children: [{ label: 'Button' }, { label: 'Input' }] },
    ]

    expect(flattenNavPaths(nav)).toEqual(['Forms', 'Forms/Button', 'Forms/Input'])
  })

  it('nests to arbitrary depth', () => {
    const nav: NavItem[] = [
      { label: 'a', children: [{ label: 'b', children: [{ label: 'c' }] }] },
    ]

    expect(flattenNavPaths(nav)).toEqual(['a', 'a/b', 'a/b/c'])
  })

  // Declaration order is display order, so the flattening must not sort.
  it('preserves declaration order rather than sorting', () => {
    const nav: NavItem[] = [{ label: 'Zulu' }, { label: 'Alpha' }]

    expect(flattenNavPaths(nav)).toEqual(['Zulu', 'Alpha'])
  })
})

// A type augmentation only applies if TypeScript loads the file at all. The
// stock Vite tsconfig uses `"include": ["src"]`, so emitting to the project
// root produced a file that looked correct and did nothing.
describe('resolveNavTypesPath', () => {
  it('emits into src when the project has one, so tsconfig include picks it up', () => {
    mkdirSync(resolve(testRoot, 'src'), { recursive: true })

    expect(resolveNavTypesPath(testRoot)).toBe(
      resolve(testRoot, 'src', 'foundry-nav.gen.d.ts')
    )
  })

  it('falls back to the project root for projects with no src directory', () => {
    expect(resolveNavTypesPath(testRoot)).toBe(resolve(testRoot, 'foundry-nav.gen.d.ts'))
  })
})

describe('writeNavTypes', () => {
  it('returns the absolute path to the generated file', () => {
    const filePath = writeNavTypes([{ label: 'Forms' }], testRoot)

    expect(filePath).toBe(resolve(testRoot, 'foundry-nav.gen.d.ts'))
    expect(existsSync(filePath)).toBe(true)
  })

  it('writes into src when the project has one', () => {
    mkdirSync(resolve(testRoot, 'src'), { recursive: true })

    const filePath = writeNavTypes([{ label: 'Forms' }], testRoot)

    expect(filePath).toBe(resolve(testRoot, 'src', 'foundry-nav.gen.d.ts'))
    expect(existsSync(filePath)).toBe(true)
  })

  it('augments the core module so NavPath resolves through Register', () => {
    const content = readFileSync(writeNavTypes([{ label: 'Forms' }], testRoot), 'utf-8')

    expect(content).toContain("declare module '@react-foundry/core' {")
    expect(content).toContain('interface Register {')
    expect(content).toContain('navPath:')
  })

  it('emits every path in the tree as a union member', () => {
    const nav: NavItem[] = [{ label: 'Forms', children: [{ label: 'Button' }] }]
    const content = readFileSync(writeNavTypes(nav, testRoot), 'utf-8')

    expect(content).toContain('navPath: "Forms" | "Forms/Button"')
  })

  // Without this the file is a script, not a module, and TypeScript rejects the
  // augmentation outright.
  it('marks the file as a module', () => {
    const content = readFileSync(writeNavTypes([{ label: 'Forms' }], testRoot), 'utf-8')

    expect(content).toContain('export {}')
  })

  it('falls back to string when no tree is declared, so previews still typecheck', () => {
    const content = readFileSync(writeNavTypes([], testRoot), 'utf-8')

    expect(content).toContain('navPath: string')
  })

  it('falls back to string when nav is absent entirely', () => {
    const content = readFileSync(writeNavTypes(undefined, testRoot), 'utf-8')

    expect(content).toContain('navPath: string')
  })

  // The union is built by string concatenation, so a label containing a quote
  // would otherwise emit a broken type and fail the user's whole typecheck.
  it('escapes quotes in labels', () => {
    const nav: NavItem[] = [{ label: 'The "Good" Parts' }]
    const content = readFileSync(writeNavTypes(nav, testRoot), 'utf-8')

    expect(content).toContain('navPath: "The \\"Good\\" Parts"')
  })

  it('handles apostrophes in labels', () => {
    const nav: NavItem[] = [{ label: "Jon's Components" }]
    const content = readFileSync(writeNavTypes(nav, testRoot), 'utf-8')

    expect(content).toContain('navPath: "Jon\'s Components"')
  })

  it('escapes backslashes in labels', () => {
    const nav: NavItem[] = [{ label: 'a\\b' }]
    const content = readFileSync(writeNavTypes(nav, testRoot), 'utf-8')

    expect(content).toContain('navPath: "a\\\\b"')
  })

  it('overwrites on subsequent calls rather than appending', () => {
    writeNavTypes([{ label: 'Old' }], testRoot)
    const content = readFileSync(writeNavTypes([{ label: 'New' }], testRoot), 'utf-8')

    expect(content).toContain('"New"')
    expect(content).not.toContain('"Old"')
  })

  it('marks the file as generated so it is not hand edited', () => {
    const content = readFileSync(writeNavTypes([{ label: 'Forms' }], testRoot), 'utf-8')

    expect(content).toContain('Generated by react-foundry')
  })

  // Editing the config hot-reloads the shelf, so the union has to be rewritten
  // in the same pass. Otherwise the running app offers a path that TypeScript
  // still rejects, and the mismatch is invisible until someone types it.
  it('reflects a path added on a later call', () => {
    writeNavTypes([{ label: 'Forms' }], testRoot)

    const content = readFileSync(
      writeNavTypes([{ label: 'Forms' }, { label: 'Layout' }], testRoot),
      'utf-8'
    )

    expect(content).toContain('"Forms" | "Layout"')
  })
})
