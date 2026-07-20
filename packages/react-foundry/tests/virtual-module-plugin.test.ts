import type { ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import {
  classifyChange,
  generateModuleSource,
  globBaseDir,
  invalidateFile,
  invalidateVirtualModule,
  type ModuleEntry,
  type PreviewMeta,
  parseExportOrder,
  parseNavPath,
  parsePreviewExports,
  resolvePreviewsGlob,
} from '../src/vite/virtual-module-plugin'

describe('parseExportOrder', () => {
  it('returns nothing for a file with no exports', () => {
    expect(parseExportOrder('const x = 1\n')).toEqual([])
  })

  // The whole reason this parser exists: `import * as m` sorts its keys
  // alphabetically per the ES spec, so authored order is unrecoverable at
  // runtime. A regression to Object.keys would pass an alphabetical fixture.
  it('preserves source order rather than alphabetical order', () => {
    const source = [
      'export const Zulu = createPreview(() => <div />)',
      'export const Alpha = createPreview(() => <div />)',
      'export const Mike = createPreview(() => <div />)',
    ].join('\n')

    expect(parseExportOrder(source)).toEqual(['Zulu', 'Alpha', 'Mike'])
  })

  it('reads exported function declarations', () => {
    expect(parseExportOrder('export function Primary() {}\n')).toEqual(['Primary'])
  })

  it('reads exported async functions', () => {
    expect(parseExportOrder('export async function Primary() {}\n')).toEqual(['Primary'])
  })

  it('reads exported generator functions', () => {
    expect(parseExportOrder('export function* Primary() {}\n')).toEqual(['Primary'])
  })

  it('reads exported classes', () => {
    expect(parseExportOrder('export class Primary {}\n')).toEqual(['Primary'])
  })

  it('reads let and var exports alongside const', () => {
    const source = 'export const A = 1\nexport let B = 2\nexport var C = 3\n'

    expect(parseExportOrder(source)).toEqual(['A', 'B', 'C'])
  })

  it('handles a declaration whose value spans multiple lines', () => {
    const source = [
      'export const Primary = createPreview({',
      "  label: 'Primary',",
      '  render: () => <Button />,',
      '})',
      'export const Danger = createPreview(() => <Button />)',
    ].join('\n')

    expect(parseExportOrder(source)).toEqual(['Primary', 'Danger'])
  })

  it('picks up the nav export, which discovery filters out later', () => {
    const source =
      "export const nav: NavPath = 'Forms/Button'\nexport const Primary = p()\n"

    expect(parseExportOrder(source)).toEqual(['nav', 'Primary'])
  })

  it('ignores default exports, which are never previews', () => {
    const source = 'export default createPreview(() => <div />)\nexport const A = 1\n'

    expect(parseExportOrder(source)).toEqual(['A'])
  })

  it('ignores re-export lists', () => {
    const source = "export { Primary } from './other'\nexport const A = 1\n"

    expect(parseExportOrder(source)).toEqual(['A'])
  })

  it('ignores star re-exports', () => {
    const source = "export * from './other'\nexport const A = 1\n"

    expect(parseExportOrder(source)).toEqual(['A'])
  })

  // Types are erased, so they are never keys on the runtime module namespace.
  it('ignores type and interface exports', () => {
    const source = [
      'export type Foo = string',
      'export interface Bar { a: string }',
      'export const A = 1',
    ].join('\n')

    expect(parseExportOrder(source)).toEqual(['A'])
  })

  it('ignores exports that are not at the start of a line', () => {
    const source = '// export const Commented = 1\nexport const Real = 2\n'

    expect(parseExportOrder(source)).toEqual(['Real'])
  })

  it('accepts identifiers with underscores and dollar signs', () => {
    const source = 'export const _private = 1\nexport const $special = 2\n'

    expect(parseExportOrder(source)).toEqual(['_private', '$special'])
  })
})

describe('parseNavPath', () => {
  it('reads a nav path declared with a type annotation', () => {
    const source = "export const nav: NavPath = 'Forms/Button'\n"

    expect(parseNavPath(source)).toBe('Forms/Button')
  })

  it('reads a nav path declared without one', () => {
    expect(parseNavPath("export const nav = 'Forms/Button'\n")).toBe('Forms/Button')
  })

  it('reads a double quoted path', () => {
    expect(parseNavPath('export const nav = "Forms/Button"\n')).toBe('Forms/Button')
  })

  it('returns null when the file declares no nav', () => {
    expect(parseNavPath('export const Primary = createPreview(() => null)\n')).toBeNull()
  })

  it('ignores a nav that is not an exported top level const', () => {
    expect(parseNavPath("const nav = 'Forms/Button'\n")).toBeNull()
  })

  it('picks the nav export out of a realistic file', () => {
    const source = [
      "import { createPreview, type NavPath } from '@react-foundry/core'",
      '',
      "export const nav: NavPath = 'Components/Inputs/Checkbox'",
      '',
      'export const Primary = createPreview(() => null)',
    ].join('\n')

    expect(parseNavPath(source)).toBe('Components/Inputs/Checkbox')
  })
})

describe('parsePreviewExports', () => {
  it('returns nothing for a file with no previews', () => {
    expect(parsePreviewExports('const x = 1\n')).toEqual([])
  })

  it('reads only createPreview exports, in source order', () => {
    const source = [
      'export const Zulu = createPreview(() => <div />)',
      'export const Alpha = createPreview(() => <div />)',
      'export const Mike = createPreview(() => <div />)',
    ].join('\n')

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Zulu', label: null },
      { exportName: 'Alpha', label: null },
      { exportName: 'Mike', label: null },
    ])
  })

  // The whole point of the parse: the nav tree is built without evaluating the
  // module, so the label has to come off the source rather than the loaded fn.
  it('reads an explicit string-literal label from the options object', () => {
    const source =
      "export const Primary = createPreview({ label: 'Primary Button', render: () => null })\n"

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Primary Button' },
    ])
  })

  it('reads a double-quoted label', () => {
    const source =
      'export const Primary = createPreview({ label: "Primary", render: () => null })\n'

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Primary' },
    ])
  })

  it('yields a null label for the bare-function form', () => {
    expect(
      parsePreviewExports('export const Primary = createPreview(() => null)\n')
    ).toEqual([{ exportName: 'Primary', label: null }])
  })

  it('handles a createPreview call spanning multiple lines', () => {
    const source = [
      'export const Primary = createPreview({',
      "  label: 'Danger Playground',",
      '  controls: { tone: { type: "select", options: ["a", "b"], default: "a" } },',
      '  render: () => <Button />,',
      '})',
      'export const Danger = createPreview(() => <Button />)',
    ].join('\n')

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Danger Playground' },
      { exportName: 'Danger', label: null },
    ])
  })

  // The regression the depth guard exists for: a `label:` nested inside the
  // controls object or the render body must not be read as the preview's label.
  it('ignores a label nested inside controls', () => {
    const source = [
      'export const Primary = createPreview({',
      '  controls: { label: { type: "text", default: "hi" } },',
      '  render: () => null,',
      '})',
    ].join('\n')

    expect(parsePreviewExports(source)).toEqual([{ exportName: 'Primary', label: null }])
  })

  it('ignores a label nested inside the render body', () => {
    const source = [
      'export const Primary = createPreview({',
      '  render: () => <List items={[{ label: "a" }]} />,',
      '})',
    ].join('\n')

    expect(parsePreviewExports(source)).toEqual([{ exportName: 'Primary', label: null }])
  })

  it('is not thrown off by braces or a colon inside a string', () => {
    const source =
      'export const Primary = createPreview({ render: () => <p>{"a: {b}"}</p>, label: \'Real\' })\n'

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Real' },
    ])
  })

  it('skips the nav export and other non-preview exports', () => {
    const source = [
      "export const nav: NavPath = 'Forms/Button'",
      'export const helper = 1',
      "export const Primary = createPreview({ label: 'Primary', render: () => null })",
    ].join('\n')

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Primary' },
    ])
  })

  it('ignores default exports, re-exports, and type exports', () => {
    const source = [
      'export default createPreview(() => null)',
      "export { Other } from './other'",
      "export * from './star'",
      'export type Foo = string',
      "export const Real = createPreview({ label: 'Real', render: () => null })",
    ].join('\n')

    expect(parsePreviewExports(source)).toEqual([{ exportName: 'Real', label: 'Real' }])
  })

  it('ignores a createPreview that is not at the start of a line', () => {
    const source =
      '// export const Commented = createPreview(() => null)\nexport const Real = createPreview(() => null)\n'

    expect(parsePreviewExports(source)).toEqual([{ exportName: 'Real', label: null }])
  })

  // A template literal is treated as computed, not a literal, so it degrades to
  // a derived name rather than risking a wrong label from an interpolation.
  it('yields a null label for a template-literal label', () => {
    const source =
      'export const Primary = createPreview({ label: `Primary`, render: () => null })\n'

    expect(parsePreviewExports(source)).toEqual([{ exportName: 'Primary', label: null }])
  })

  it('does not match a longer identifier ending in label', () => {
    const source =
      "export const Primary = createPreview({ ariaLabel: 'nope', render: () => null })\n"

    expect(parsePreviewExports(source)).toEqual([{ exportName: 'Primary', label: null }])
  })
})

// The reason each branch exists is the log line a user reads when a reload
// happens. Without these, the whole diff could return the wrong branch silently.
describe('classifyChange', () => {
  const meta = (
    nav: string | null,
    previews: { exportName: string; label: string | null }[]
  ): PreviewMeta => ({ nav, previews })
  const named = (...names: string[]) =>
    names.map((exportName) => ({ exportName, label: null }))

  it('reports a removed file', () => {
    expect(classifyChange(meta('Forms', named('Primary')), null)).toBe('preview removed')
  })

  it('reports a file it has not seen before', () => {
    expect(classifyChange(undefined, meta('Forms', named('Primary')))).toBe(
      'preview added'
    )
  })

  it('reports a moved nav path, naming the destination', () => {
    expect(
      classifyChange(meta('Forms', named('Primary')), meta('Layout', named('Primary')))
    ).toBe('moved to Layout')
  })

  it('treats gaining a nav path as a move', () => {
    expect(
      classifyChange(meta(null, named('Primary')), meta('Forms', named('Primary')))
    ).toBe('moved to Forms')
  })

  it('reports an added preview', () => {
    expect(
      classifyChange(
        meta('Forms', named('Primary')),
        meta('Forms', named('Primary', 'Danger'))
      )
    ).toBe('previews added or reordered')
  })

  it('reports a removed preview', () => {
    expect(
      classifyChange(
        meta('Forms', named('Primary', 'Danger')),
        meta('Forms', named('Primary'))
      )
    ).toBe('previews added or reordered')
  })

  // Same set, different order: the tree order changes even though nothing else did.
  it('reports a reorder', () => {
    expect(
      classifyChange(
        meta('Forms', named('Primary', 'Danger')),
        meta('Forms', named('Danger', 'Primary'))
      )
    ).toBe('previews added or reordered')
  })

  // Labels feed the shelf now that they are parsed statically, so an edit to one
  // alone still changes what the user sees.
  it('reports a label change when the export set is unchanged', () => {
    expect(
      classifyChange(
        meta('Forms', [{ exportName: 'Primary', label: 'Primary' }]),
        meta('Forms', [{ exportName: 'Primary', label: 'Primary Button' }])
      )
    ).toBe('label changed')
  })

  it('reports an ordinary edit when nothing structural changed', () => {
    expect(
      classifyChange(meta('Forms', named('Primary')), meta('Forms', named('Primary')))
    ).toBe('edited')
  })
})

describe('invalidation', () => {
  function fakeServer(modules: Record<string, { importers?: string[] }>) {
    const invalidated: string[] = []
    const byId = new Map<string, { id: string; importers: Set<unknown> }>()

    for (const id of Object.keys(modules)) {
      byId.set(id, { id, importers: new Set() })
    }
    for (const [id, { importers = [] }] of Object.entries(modules)) {
      for (const importer of importers) {
        byId.get(id)?.importers.add(byId.get(importer))
      }
    }

    const server = {
      moduleGraph: {
        getModuleById: (id: string) => byId.get(id),
        getModulesByFile: (file: string) => {
          const mod = byId.get(file)
          return mod ? new Set([mod]) : undefined
        },
        invalidateModule: (mod: { id: string }) => invalidated.push(mod.id),
      },
    } as unknown as ViteDevServer

    return { server, invalidated }
  }

  describe('invalidateFile', () => {
    it('drops the modules Vite holds for a file', () => {
      const { server, invalidated } = fakeServer({ '/p/a.preview.tsx': {} })

      expect(invalidateFile(server, '/p/a.preview.tsx')).toBe(1)
      expect(invalidated).toEqual(['/p/a.preview.tsx'])
    })

    it('reports zero for a file Vite never loaded', () => {
      const { server, invalidated } = fakeServer({})

      expect(invalidateFile(server, '/p/missing.preview.tsx')).toBe(0)
      expect(invalidated).toEqual([])
    })
  })

  describe('invalidateVirtualModule', () => {
    const RESOLVED = '\0virtual:react-foundry-previews'

    it('drops the generated module', () => {
      const { server, invalidated } = fakeServer({ [RESOLVED]: {} })

      expect(invalidateVirtualModule(server)).toBe(1)
      expect(invalidated).toEqual([RESOLVED])
    })

    // Discovery memoizes the tree, so its module has to go too.
    it('drops importers as well', () => {
      const { server, invalidated } = fakeServer({
        [RESOLVED]: { importers: ['/app/discovery.ts'] },
        '/app/discovery.ts': { importers: ['/app/root.tsx'] },
        '/app/root.tsx': {},
      })

      expect(invalidateVirtualModule(server)).toBe(3)
      expect(invalidated).toContain('/app/discovery.ts')
      expect(invalidated).toContain('/app/root.tsx')
    })

    it('does not loop forever on a circular importer graph', () => {
      const { server } = fakeServer({
        [RESOLVED]: { importers: ['/app/a.ts'] },
        '/app/a.ts': { importers: ['/app/b.ts'] },
        '/app/b.ts': { importers: ['/app/a.ts'] },
      })

      expect(invalidateVirtualModule(server)).toBe(3)
    })

    it('falls back to the unresolved id', () => {
      const { server } = fakeServer({ 'virtual:react-foundry-previews': {} })

      expect(invalidateVirtualModule(server)).toBe(1)
    })

    // Nothing has imported it yet, which is worth reporting rather than hiding.
    it('reports zero when the module is not in the graph', () => {
      const { server } = fakeServer({})

      expect(invalidateVirtualModule(server)).toBe(0)
    })
  })
})

describe('generateModuleSource', () => {
  const entry = (
    normalizedPath: string,
    nav: string | null,
    previews: { exportName: string; label: string | null }[]
  ): ModuleEntry => ({ normalizedPath, nav, previews })

  it('emits nothing but the empty map for no entries', () => {
    const source = generateModuleSource([])

    expect(source).toContain('const previewModules = {')
    expect(source).toContain('export default previewModules')
  })

  // The whole point of the refactor: no static import means the preview and its
  // deps stay out of the initial chunk, reachable only through the lazy loader.
  it('emits no static import, only a lazy loader per file', () => {
    const source = generateModuleSource([
      entry('/p/a.preview.tsx', 'Forms', [{ exportName: 'Primary', label: null }]),
    ])

    expect(source).not.toContain('import * as')
    expect(source).toContain('load: () => import("/p/a.preview.tsx")')
  })

  it('keys the map by path with its nav, previews, and loader', () => {
    const source = generateModuleSource([
      entry('/p/a.preview.tsx', 'Forms/Button', [
        { exportName: 'Primary', label: 'Primary' },
        { exportName: 'Danger', label: null },
      ]),
    ])

    expect(source).toContain(
      '"/p/a.preview.tsx": { nav: "Forms/Button", previews: [{"exportName":"Primary","label":"Primary"},{"exportName":"Danger","label":null}], load: () => import("/p/a.preview.tsx") }'
    )
  })

  it('emits a missing nav as the literal null', () => {
    const source = generateModuleSource([entry('/p/a.preview.tsx', null, [])])

    expect(source).toContain('nav: null')
  })

  // A single quote in a path would otherwise close the string literal early and
  // emit a broken module, in both the map key and the dynamic import.
  it('escapes a path containing a quote', () => {
    const source = generateModuleSource([
      entry("/p/o'brien.preview.tsx", null, [{ exportName: 'A', label: null }]),
    ])

    expect(source).toContain('import("/p/o\'brien.preview.tsx")')
    expect(source).not.toContain("o'brien.preview.tsx'")
  })

  // The generated text must be valid JS. Strip the module-only export line and
  // parse the rest; a quoting break would throw here. A dynamic `import()` is a
  // valid expression in a plain function body, so it need not be stripped.
  it('produces syntactically valid module source', () => {
    const source = generateModuleSource([
      entry('/p/a.preview.tsx', 'Forms', [{ exportName: 'Primary', label: 'Primary' }]),
      entry("/p/it's.preview.tsx", null, [{ exportName: 'Danger', label: null }]),
    ])
    const body = source.replace(/^export default .*$/gm, '')

    expect(() => new Function(body)).not.toThrow()
  })
})

describe('resolvePreviewsGlob', () => {
  it('strips a leading ./', () => {
    expect(resolvePreviewsGlob('./src/**/*.preview.tsx', '/proj')).toBe(
      '/proj/src/**/*.preview.tsx'
    )
  })

  it('strips a leading /', () => {
    expect(resolvePreviewsGlob('/src/**/*.preview.tsx', '/proj')).toBe(
      '/proj/src/**/*.preview.tsx'
    )
  })

  it('leaves a bare relative pattern alone', () => {
    expect(resolvePreviewsGlob('src/**/*.preview.tsx', '/proj')).toBe(
      '/proj/src/**/*.preview.tsx'
    )
  })
})

describe('globBaseDir', () => {
  it('stops at the first segment containing a wildcard', () => {
    expect(globBaseDir('/proj/src/components/**/*.preview.tsx')).toBe(
      '/proj/src/components'
    )
  })

  it('handles a wildcard in the filename only', () => {
    expect(globBaseDir('/proj/src/*.preview.tsx')).toBe('/proj/src')
  })

  it('handles brace expansion', () => {
    expect(globBaseDir('/proj/src/{a,b}/*.tsx')).toBe('/proj/src')
  })

  it('handles character classes', () => {
    expect(globBaseDir('/proj/src/[ab]/*.tsx')).toBe('/proj/src')
  })

  it('drops the filename when the pattern has no wildcard at all', () => {
    expect(globBaseDir('/proj/src/button.preview.tsx')).toBe('/proj/src')
  })
})
