import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import type { ResolvedConfig, ViteDevServer } from 'vite'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  appendRenderRegistrations,
  applyPreviewChange,
  classifyChange,
  createVirtualModulePlugin,
  docsMiddleware,
  docsModuleId,
  docsUrl,
  generateModuleSource,
  globBaseDir,
  invalidateDocsModule,
  invalidateFile,
  invalidateVirtualModule,
  isSourceFile,
  isStructuralChange,
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

  // The one branch that must not reload, stated as the decision the watcher acts on
  // rather than as the log line it prints.
  describe('isStructuralChange', () => {
    it('is false only for an ordinary edit', () => {
      expect(
        isStructuralChange(
          meta('Forms', named('Primary')),
          meta('Forms', named('Primary'))
        )
      ).toBe(false)
    })

    it.each([
      ['a removed file', meta('Forms', named('Primary')), null],
      ['an unseen file', undefined, meta('Forms', named('Primary'))],
      ['a move', meta('Forms', named('Primary')), meta('Layout', named('Primary'))],
      [
        'an added preview',
        meta('Forms', named('Primary')),
        meta('Forms', named('Primary', 'Danger')),
      ],
      [
        'a label change',
        meta('Forms', [{ exportName: 'Primary', label: 'A' }]),
        meta('Forms', [{ exportName: 'Primary', label: 'B' }]),
      ],
      [
        'a file that declares controls',
        meta('Forms', [{ exportName: 'Primary', controlsSource: '{}' }]),
        meta('Forms', [{ exportName: 'Primary', controlsSource: '{}' }]),
      ],
    ])('is true for %s', (_name, previous, next) => {
      expect(isStructuralChange(previous, next)).toBe(true)
    })
  })
})

// The watcher itself is fs.watch inside configureServer, which no test can reach,
// so the decision it acts on lives here instead.
describe('applyPreviewChange', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'foundry-preview-change-'))
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
  })

  function fakeServer() {
    const invalidated: string[] = []
    const sent: unknown[] = []

    const server = {
      moduleGraph: {
        getModuleById: () => undefined,
        getModulesByFile: (file: string) => new Set([{ id: file, importers: new Set() }]),
        invalidateModule: (mod: { id: string }) => invalidated.push(mod.id),
      },
      ws: { send: (payload: unknown) => sent.push(payload) },
    } as unknown as ViteDevServer

    return { server, invalidated, sent }
  }

  /** Writes the preview file and hands back its path. */
  function write(body: string, extra = ''): string {
    const file = resolve(dir, 'a.preview.tsx')
    writeFileSync(
      file,
      [
        "export const nav = 'Forms'",
        extra,
        `export const Primary = createPreview(${body})`,
      ].join('\n'),
      'utf-8'
    )
    return file
  }

  /** Seeds the map the way `load` does, so a change has something to compare to. */
  function seen(file: string, previews: PreviewInput[] = [{ exportName: 'Primary' }]) {
    return new Map<string, PreviewMeta>([
      [file, { nav: 'Forms', previews: parsed(previews) }],
    ])
  }

  // The point of the whole gate: Vite is already hot-patching this file, and
  // invalidating here would throw away the update it is applying.
  it('leaves a render-body edit alone', () => {
    const file = write('() => <p>one</p>')
    const meta = seen(file)
    const { server, invalidated, sent } = fakeServer()

    write('() => <p>two</p>')
    const result = applyPreviewChange(server, file, meta)

    expect(result).toEqual({ change: 'edited', reloaded: false, dropped: 0 })
    expect(sent).toEqual([])
    expect(invalidated).toEqual([])
  })

  it('reloads when a preview is added, dropping the file and the generated module', () => {
    const file = write('() => null')
    const meta = seen(file)
    const { server, invalidated, sent } = fakeServer()

    writeFileSync(
      file,
      [
        "export const nav = 'Forms'",
        'export const Primary = createPreview(() => null)',
        'export const Danger = createPreview(() => null)',
      ].join('\n'),
      'utf-8'
    )
    const result = applyPreviewChange(server, file, meta)

    expect(result?.change).toBe('previews added or reordered')
    expect(result?.reloaded).toBe(true)
    expect(sent).toEqual([{ type: 'full-reload' }])
    expect(invalidated).toContain(file)
  })

  it('reloads when the nav path moves', () => {
    const file = write('() => null')
    const meta = seen(file)
    const { server, sent } = fakeServer()

    writeFileSync(
      file,
      "export const nav = 'Layout'\nexport const Primary = createPreview(() => null)\n",
      'utf-8'
    )

    expect(applyPreviewChange(server, file, meta)?.change).toBe('moved to Layout')
    expect(sent).toEqual([{ type: 'full-reload' }])
  })

  // A schema can reach the call site by name, so an unchanged span is not proof it
  // held still, and the props panel renders from an object a hot patch never replaces.
  it('reloads a file that declares controls even on a body-only edit', () => {
    const file = write('{ controls: schema, render: () => <p>one</p> }')
    const meta = seen(file, [{ exportName: 'Primary', controlsSource: 'schema' }])
    const { server, sent } = fakeServer()

    write('{ controls: schema, render: () => <p>two</p> }')
    const result = applyPreviewChange(server, file, meta)

    expect(result?.change).toBe('controls may have changed')
    expect(sent).toEqual([{ type: 'full-reload' }])
  })

  it('reloads for a file it has not seen, since there is nothing to compare', () => {
    const file = write('() => null')
    const { server, sent } = fakeServer()

    expect(applyPreviewChange(server, file, new Map())?.change).toBe('preview added')
    expect(sent).toEqual([{ type: 'full-reload' }])
  })

  it('reloads when the file is gone', () => {
    const file = resolve(dir, 'a.preview.tsx')
    const meta = seen(file)
    const { server, sent } = fakeServer()

    expect(applyPreviewChange(server, file, meta)?.change).toBe('preview removed')
    expect(sent).toEqual([{ type: 'full-reload' }])
  })

  // A half-written file reads as a syntax error at best and throws at worst. The next
  // event carries the finished one, so the right move is to do nothing at all.
  it('does nothing when the file cannot be read', () => {
    const file = resolve(dir, 'a.preview.tsx')
    mkdirSync(file) // exists, but reading it throws EISDIR
    const { server, invalidated, sent } = fakeServer()

    expect(applyPreviewChange(server, file, seen(file))).toBeNull()
    expect(sent).toEqual([])
    expect(invalidated).toEqual([])
  })

  // The bookkeeping matters because a hot-patched file never goes back through
  // `load`, which is the only other thing that fills this map.
  it('records what the file looks like now, so the next change compares to it', () => {
    const file = write('() => null')
    const meta = seen(file)
    const { server } = fakeServer()

    rmSync(file)
    expect(applyPreviewChange(server, file, meta)?.change).toBe('preview removed')
    expect(meta.has(file)).toBe(false)

    write('() => null')
    expect(applyPreviewChange(server, file, meta)?.change).toBe('preview added')
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
      '"/p/a.preview.tsx": { nav: "Forms/Button", previews: [{"exportName":"Primary","label":"Primary"},{"exportName":"Danger","label":null}], load: () => import("/p/a.preview.tsx"), docs: () => import("virtual:react-foundry-docs:%2Fp%2Fa.preview.tsx").then((m) => m.default) }'
    )
  })

  // Its own dynamic import, so reading prop types with the checker is paid when a
  // preview is opened and never on the first load of the shell.
  it('points each file at its own lazily imported docs module', () => {
    const source = generateModuleSource([entry('/p/a.preview.tsx', null, [])])

    expect(source).toContain(
      'docs: () => import("virtual:react-foundry-docs:%2Fp%2Fa.preview.tsx")'
    )
  })

  // In dev the docs are fetched, not imported: a module is cached by the browser
  // by URL, so a re-import after a component edit would be the stale copy.
  it('fetches the docs from the dev server instead when serving', () => {
    const source = generateModuleSource([entry('/p/a.preview.tsx', null, [])], {
      kind: 'fetch',
      base: '/app/',
    })

    expect(source).toContain(
      'docs: () => fetch("/app/@react-foundry-docs?file=%2Fp%2Fa.preview.tsx").then((r) => r.json())'
    )
    expect(source).not.toContain('virtual:react-foundry-docs')
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

// A bare-form render is registered by the refresh transform itself; an options-form
// one is not, and without a family of its own a hot patch remounts it. These lines
// give it one under the export's name.
describe('appendRenderRegistrations', () => {
  const code = 'export const Playground = createPreview({ render: () => null })'

  it('appends one guarded registration per preview, after the code', () => {
    const out = appendRenderRegistrations(
      code,
      parsed([{ exportName: 'Playground' }, { exportName: 'Sizes' }])
    )

    expect(out.startsWith(code)).toBe(true)
    expect(out).toContain(
      `if (typeof $RefreshReg$ === 'function') $RefreshReg$(Playground.render, "Playground$render");`
    )
    expect(out).toContain(
      `if (typeof $RefreshReg$ === 'function') $RefreshReg$(Sizes.render, "Sizes$render");`
    )
  })

  it('returns the code untouched for a file with no previews', () => {
    expect(appendRenderRegistrations(code, [])).toBe(code)
  })

  // The refresh wrapper adds its header and footer only to code that calls
  // `$RefreshReg$(`, which a file of options-form previews otherwise never does.
  it('contains the call the refresh wrapper gates on', () => {
    expect(appendRenderRegistrations(code, parsed([{ exportName: 'A' }]))).toMatch(
      /\$RefreshReg\$\(/
    )
  })
})

describe('the transform hook', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'foundry-preview-refresh-'))
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  /** Unwraps a hook declared as a function or as `{ handler }`. */
  function hook<T>(value: T | { handler: T } | undefined): T {
    if (!value) throw new Error('hook not defined')
    return typeof value === 'function' ? value : (value as { handler: T }).handler
  }

  async function setUp(config: { command: 'serve' | 'build'; hmr?: boolean }) {
    const file = resolve(dir, 'a.preview.tsx')
    writeFileSync(
      file,
      [
        "export const nav = 'Forms'",
        'export const Playground = createPreview({ render: () => null })',
        'export const Primary = createPreview(() => null)',
      ].join('\n'),
      'utf-8'
    )

    const plugin = createVirtualModulePlugin('*.preview.tsx', dir)
    hook(plugin.configResolved).call(
      {} as never,
      {
        command: config.command,
        server: { hmr: config.hmr ?? true },
      } as unknown as ResolvedConfig
    )
    await hook(plugin.load).call({} as never, '\0virtual:react-foundry-previews')

    const transform = (id: string) =>
      hook(plugin.transform).call({} as never, 'const code = 1', id) as
        | { code: string }
        | undefined

    return { file, transform }
  }

  it('appends a registration for every preview in a file the module has parsed', async () => {
    const { file, transform } = await setUp({ command: 'serve' })

    const out = transform(file)

    expect(out?.code).toContain('$RefreshReg$(Playground.render, "Playground$render")')
    expect(out?.code).toContain('$RefreshReg$(Primary.render, "Primary$render")')
  })

  it('matches the file through a query suffix', async () => {
    const { file, transform } = await setUp({ command: 'serve' })

    expect(transform(`${file}?t=1`)?.code).toContain('Playground$render')
  })

  it('leaves a file the module does not know alone', async () => {
    const { transform } = await setUp({ command: 'serve' })

    expect(transform(resolve(dir, 'button.tsx'))).toBeUndefined()
  })

  it('does nothing in a build', async () => {
    const { file, transform } = await setUp({ command: 'build' })

    expect(transform(file)).toBeUndefined()
  })

  // Nothing declares `$RefreshReg$` with HMR off; the guard in the appended line
  // covers a stray call, but there is no reason to append one at all.
  it('does nothing with HMR off', async () => {
    const { file, transform } = await setUp({ command: 'serve', hmr: false })

    expect(transform(file)).toBeUndefined()
  })
})

// The docs module is generated on demand from the previews the module already
// parsed, through the checker, and dropped with the file so a reload rereads it.
describe('the docs module', () => {
  let dir: string

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'foundry-docs-module-'))
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    rmSync(dir, { recursive: true, force: true })
    vi.restoreAllMocks()
  })

  function hook<T>(value: T | { handler: T } | undefined): T {
    if (!value) throw new Error('hook not defined')
    return typeof value === 'function' ? value : (value as { handler: T }).handler
  }

  it('resolves its id to a virtual one and loads the file docs as JSON', async () => {
    writeFileSync(
      resolve(dir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { strict: true, moduleResolution: 'bundler' } })
    )
    writeFileSync(
      resolve(dir, 'button.tsx'),
      'export const Button = (_props: { variant?: "a" | "b" }) => null\n'
    )
    const file = resolve(dir, 'a.preview.tsx')
    writeFileSync(
      file,
      [
        "import { controlsFor, createPreview } from 'react-foundry'",
        "import { Button } from './button'",
        'export const Playground = createPreview({ controls: controlsFor(Button, { variant: { type: "text" } }), render: () => null })',
      ].join('\n'),
      'utf-8'
    )

    const plugin = createVirtualModulePlugin('*.preview.tsx', dir)
    await hook(plugin.load).call({} as never, '\0virtual:react-foundry-previews')

    const id = docsModuleId(file)
    const resolved = hook(plugin.resolveId).call({} as never, id, undefined, {} as never)
    expect(resolved).toBe(`\0${id}`)

    const source = await hook(plugin.load).call({} as never, `\0${id}`)
    expect(source).toContain('export default ')
    expect(
      JSON.parse(
        String(source)
          .replace(/^export default /, '')
          .replace(/;\s*$/, '')
      )
    ).toEqual({
      Playground: { variant: { name: 'variant', type: '"a" | "b"', optional: true } },
    })
  })

  it('drops the docs module for a file, and reports nothing for one never loaded', () => {
    const invalidated: string[] = []
    const id = `\0${docsModuleId('/p/a.preview.tsx')}`
    const mod = { id, importers: new Set() }
    const server = {
      moduleGraph: {
        getModuleById: (wanted: string) => (wanted === id ? mod : undefined),
        getModulesByFile: () => undefined,
        invalidateModule: (m: { id: string }) => invalidated.push(m.id),
      },
      ws: { send: () => {} },
    } as unknown as ViteDevServer

    expect(invalidateDocsModule(server, '/p/a.preview.tsx')).toBe(1)
    expect(invalidated).toEqual([id])
    expect(invalidateDocsModule(server, '/p/b.preview.tsx')).toBe(0)
  })
})

describe('docsUrl', () => {
  it('sits under the base without doubling the slash', () => {
    expect(docsUrl('/', '/p/a.preview.tsx')).toBe(
      '/@react-foundry-docs?file=%2Fp%2Fa.preview.tsx'
    )
    expect(docsUrl('/app/', '/p/a.preview.tsx')).toBe(
      '/app/@react-foundry-docs?file=%2Fp%2Fa.preview.tsx'
    )
  })
})

describe('isSourceFile', () => {
  it.each([
    '/p/button.tsx',
    '/p/button.ts',
    '/p/util.js',
    '/p/x.mts',
  ])('is true for %s, whose edit may change a prop', (file) => {
    expect(isSourceFile(file)).toBe(true)
  })

  // A preview file reloads on its own path, and a stylesheet declares no props.
  it.each([
    '/p/a.preview.tsx',
    '/p/a.css.ts.map',
    '/p/a.css',
    '/p/a.md',
  ])('is false for %s', (file) => {
    expect(isSourceFile(file)).toBe(false)
  })
})

describe('docsMiddleware', () => {
  function request(url: string) {
    const headers: Record<string, string> = {}
    let body = ''
    let passed = false
    const req = { url } as never
    const res = {
      setHeader: (name: string, value: string) => {
        headers[name] = value
      },
      end: (chunk: string) => {
        body = chunk
      },
    } as never
    const next = () => {
      passed = true
    }
    return {
      req,
      res,
      next,
      headers: () => headers,
      body: () => body,
      passed: () => passed,
    }
  }

  it('answers a docs request with the file docs as JSON', () => {
    const service = { docsFor: (file: string) => ({ [file]: {} }) }
    const middleware = docsMiddleware(() => service)
    const r = request('/@react-foundry-docs?file=%2Fp%2Fa.preview.tsx')

    middleware(r.req, r.res, r.next)

    expect(r.passed()).toBe(false)
    expect(r.headers()['Content-Type']).toBe('application/json')
    expect(JSON.parse(r.body())).toEqual({ '/p/a.preview.tsx': {} })
  })

  it('answers with nothing when the project has no TypeScript', () => {
    const middleware = docsMiddleware(() => null)
    const r = request('/@react-foundry-docs?file=%2Fp%2Fa.preview.tsx')

    middleware(r.req, r.res, r.next)

    expect(JSON.parse(r.body())).toEqual({})
  })

  it('passes every other request through', () => {
    const middleware = docsMiddleware(() => null)
    const r = request('/src/main.tsx')

    middleware(r.req, r.res, r.next)

    expect(r.passed()).toBe(true)
    expect(r.body()).toBe('')
  })
})

describe('the hot update hook', () => {
  function hook<T>(value: T | { handler: T } | undefined): T {
    if (!value) throw new Error('hook not defined')
    return typeof value === 'function' ? value : (value as { handler: T }).handler
  }

  function serverSpy() {
    const sent: unknown[] = []
    return {
      server: { ws: { send: (payload: unknown) => sent.push(payload) } } as never,
      sent,
    }
  }

  it('tells the browser the docs may have changed when a source file changes', () => {
    const plugin = createVirtualModulePlugin('*.preview.tsx', '/p')
    const { server, sent } = serverSpy()

    hook(plugin.hotUpdate).call({} as never, { file: '/p/button.tsx', server } as never)

    expect(sent).toEqual([
      {
        type: 'custom',
        event: 'react-foundry:docs-changed',
        data: { file: '/p/button.tsx' },
      },
    ])
  })

  it('stays quiet for a preview file, which reloads on its own path', () => {
    const plugin = createVirtualModulePlugin('*.preview.tsx', '/p')
    const { server, sent } = serverSpy()

    hook(plugin.hotUpdate).call(
      {} as never,
      { file: '/p/a.preview.tsx', server } as never
    )

    expect(sent).toEqual([])
  })
})
