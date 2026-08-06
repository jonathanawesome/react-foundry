import type { ViteDevServer } from 'vite'
import { describe, expect, it } from 'vitest'

import {
  classifyChange,
  generateModuleSource,
  globBaseDir,
  invalidateFile,
  invalidateVirtualModule,
  type ModuleEntry,
  type ParsedPreview,
  type PreviewMeta,
  parseNavPath,
  parsePreviewExports,
  resolvePreviewsGlob,
} from '../src/vite/virtual-module-plugin'

/**
 * A preview as the tests below care to spell it out. Only `exportName` is ever
 * required; the rest default to what a bare-function preview parses to, so a test
 * names only the field it is about.
 */
type PreviewInput = Partial<ParsedPreview> & { exportName: string }

const parsed = (previews: PreviewInput[]): ParsedPreview[] =>
  previews.map((preview) => ({ label: null, controlsSource: null, ...preview }))

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
      { exportName: 'Zulu', label: null, controlsSource: null },
      { exportName: 'Alpha', label: null, controlsSource: null },
      { exportName: 'Mike', label: null, controlsSource: null },
    ])
  })

  // The whole point of the parse: the nav tree is built without evaluating the
  // module, so the label has to come off the source rather than the loaded fn.
  it('reads an explicit string-literal label from the options object', () => {
    const source =
      "export const Primary = createPreview({ label: 'Primary Button', render: () => null })\n"

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Primary Button', controlsSource: null },
    ])
  })

  it('reads a double-quoted label', () => {
    const source =
      'export const Primary = createPreview({ label: "Primary", render: () => null })\n'

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Primary', controlsSource: null },
    ])
  })

  it('yields a null label for the bare-function form', () => {
    expect(
      parsePreviewExports('export const Primary = createPreview(() => null)\n')
    ).toEqual([{ exportName: 'Primary', label: null, controlsSource: null }])
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
      {
        exportName: 'Primary',
        label: 'Danger Playground',
        controlsSource: '{ tone: { type: "select", options: ["a", "b"], default: "a" } }',
      },
      { exportName: 'Danger', label: null, controlsSource: null },
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

    expect(parsePreviewExports(source)).toEqual([
      {
        exportName: 'Primary',
        label: null,
        controlsSource: '{ label: { type: "text", default: "hi" } }',
      },
    ])
  })

  it('ignores a label nested inside the render body', () => {
    const source = [
      'export const Primary = createPreview({',
      '  render: () => <List items={[{ label: "a" }]} />,',
      '})',
    ].join('\n')

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: null, controlsSource: null },
    ])
  })

  it('is not thrown off by braces or a colon inside a string', () => {
    const source =
      'export const Primary = createPreview({ render: () => <p>{"a: {b}"}</p>, label: \'Real\' })\n'

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Real', controlsSource: null },
    ])
  })

  it('skips the nav export and other non-preview exports', () => {
    const source = [
      "export const nav: NavPath = 'Forms/Button'",
      'export const helper = 1',
      "export const Primary = createPreview({ label: 'Primary', render: () => null })",
    ].join('\n')

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: 'Primary', controlsSource: null },
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

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Real', label: 'Real', controlsSource: null },
    ])
  })

  it('ignores a createPreview that is not at the start of a line', () => {
    const source =
      '// export const Commented = createPreview(() => null)\nexport const Real = createPreview(() => null)\n'

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Real', label: null, controlsSource: null },
    ])
  })

  // A template literal is treated as computed, not a literal, so it degrades to
  // a derived name rather than risking a wrong label from an interpolation.
  it('yields a null label for a template-literal label', () => {
    const source =
      'export const Primary = createPreview({ label: `Primary`, render: () => null })\n'

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: null, controlsSource: null },
    ])
  })

  it('does not match a longer identifier ending in label', () => {
    const source =
      "export const Primary = createPreview({ ariaLabel: 'nope', render: () => null })\n"

    expect(parsePreviewExports(source)).toEqual([
      { exportName: 'Primary', label: null, controlsSource: null },
    ])
  })

  // `controls` is read so an edit to a schema can be told apart from an edit to a
  // render body. The props panel renders from the object the route loader captured,
  // which a Fast Refresh patch does not replace, so a schema edit has to reload.
  describe('the controls source', () => {
    const controlsOf = (source: string) => parsePreviewExports(source)[0]?.controlsSource

    it('is captured verbatim, ending at the comma that closes the property', () => {
      const source =
        "export const P = createPreview({ controls: { tone: { type: 'select' } }, render: () => null })\n"

      expect(controlsOf(source)).toBe("{ tone: { type: 'select' } }")
    })

    it('is captured when it is the last property, ending at the closing brace', () => {
      const source =
        "export const P = createPreview({ render: () => null, controls: { n: { type: 'number' } } })\n"

      expect(controlsOf(source)).toBe("{ n: { type: 'number' } }")
    })

    // Commas and braces inside a string or an options array would end the span
    // early if the scan did not skip them, truncating the schema it compares.
    it('survives commas and braces inside strings and nested arrays', () => {
      const source = [
        'export const P = createPreview({',
        '  controls: { tone: { type: "select", options: ["a, b", "{c}"] } },',
        '  render: () => null,',
        '})',
      ].join('\n')

      expect(controlsOf(source)).toBe(
        '{ tone: { type: "select", options: ["a, b", "{c}"] } }'
      )
    })

    it('is null for a preview with no controls', () => {
      const source =
        "export const P = createPreview({ label: 'P', render: () => null })\n"

      expect(controlsOf(source)).toBeNull()
    })

    it('is null for the bare-function form', () => {
      expect(controlsOf('export const P = createPreview(() => null)\n')).toBeNull()
    })

    // Same depth guard the label relies on: only a key of the options object counts.
    it('ignores a controls key nested inside the render body', () => {
      const source = [
        'export const P = createPreview({',
        '  render: () => <Panel controls={{ a: 1 }} />,',
        '})',
      ].join('\n')

      expect(controlsOf(source)).toBeNull()
    })

    it('is null for a shorthand property, which has no value to read', () => {
      const source = 'export const P = createPreview({ controls, render: () => null })\n'

      expect(controlsOf(source)).toBeNull()
    })
  })
})

// The reason each branch exists is the log line a user reads when a reload
// happens. Without these, the whole diff could return the wrong branch silently.
describe('classifyChange', () => {
  const meta = (nav: string | null, previews: PreviewInput[]): PreviewMeta => ({
    nav,
    previews: parsed(previews),
  })
  const named = (...names: string[]) => names.map((exportName) => ({ exportName }))

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

  // The props panel renders from the controls object the route loader captured, and
  // a Fast Refresh patch swaps the render without replacing that object. Left as an
  // ordinary edit, a schema change would hot-patch the canvas while the panel kept
  // describing the previous shape.
  it('reports a controls change when the export set and labels are unchanged', () => {
    expect(
      classifyChange(
        meta('Forms', [{ exportName: 'Primary', controlsSource: '{ tone: {} }' }]),
        meta('Forms', [
          { exportName: 'Primary', controlsSource: '{ tone: {}, size: {} }' },
        ])
      )
    ).toBe('controls changed')
  })

  it('reports gaining controls where there were none', () => {
    expect(
      classifyChange(
        meta('Forms', named('Primary')),
        meta('Forms', [{ exportName: 'Primary', controlsSource: '{ tone: {} }' }])
      )
    ).toBe('controls changed')
  })

  // A schema can reach the call site from elsewhere in the module, and then it reads
  // the same before and after it is edited. `controls: buttonControls` in the demo's
  // button previews is exactly this. Judging which spans are self-contained means
  // resolving identifiers, so declaring controls at all is what forces the reload.
  it('reports that controls may have changed when a file declares any', () => {
    expect(
      classifyChange(
        meta('Forms', [{ exportName: 'Primary', controlsSource: 'buttonControls' }]),
        meta('Forms', [{ exportName: 'Primary', controlsSource: 'buttonControls' }])
      )
    ).toBe('controls may have changed')
  })

  // Even an inline literal takes this branch: a spread inside it can pull in an
  // outside schema, so an unchanged span is not proof the schema held still.
  it('reports the same for an unchanged inline schema', () => {
    expect(
      classifyChange(
        meta('Forms', [{ exportName: 'Primary', controlsSource: '{ tone: {} }' }]),
        meta('Forms', [{ exportName: 'Primary', controlsSource: '{ tone: {} }' }])
      )
    ).toBe('controls may have changed')
  })

  // The negative control for everything above, and the case the whole gate exists to
  // reach: a render-body edit in a file with no controls leaves every parsed field
  // alone, so it is Fast Refresh's to handle rather than a reload's.
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

    // The generated config module is reached this way, and `app/nav.ts` imports it
    // and memoizes the tree. Leaving that importer cached is what left the shelf
    // rendering the previous nav after a config edit.
    it('drops importers as well', () => {
      const { server, invalidated } = fakeServer({
        '/cache/react-foundry-config.js': { importers: ['/app/nav.ts'] },
        '/app/nav.ts': { importers: ['/app/root-route.tsx'] },
        '/app/root-route.tsx': {},
      })

      expect(invalidateFile(server, '/cache/react-foundry-config.js')).toBe(3)
      expect(invalidated).toContain('/app/nav.ts')
      expect(invalidated).toContain('/app/root-route.tsx')
    })

    it('does not loop forever on a circular importer graph', () => {
      const { server } = fakeServer({
        '/cache/react-foundry-config.js': { importers: ['/app/a.ts'] },
        '/app/a.ts': { importers: ['/app/b.ts'] },
        '/app/b.ts': { importers: ['/app/a.ts'] },
      })

      expect(invalidateFile(server, '/cache/react-foundry-config.js')).toBe(3)
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
    previews: PreviewInput[]
  ): ModuleEntry => ({ normalizedPath, nav, previews: parsed(previews) })

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
