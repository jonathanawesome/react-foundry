import { existsSync, readFileSync, watch } from 'node:fs'
import { resolve } from 'node:path'
import { glob } from 'glob'
import pc from 'picocolors'
import type { Plugin, ViteDevServer } from 'vite'

const VIRTUAL_MODULE_ID = 'virtual:react-foundry-previews'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

/** Matches `export const nav = '...'`, with or without a type annotation. */
const NAV_PATTERN = /^export\s+const\s+nav\s*(?::[^=]+)?=\s*['"]([^'"]*)['"]/m

/**
 * Reads a file's declared nav path, which decides where its previews sit.
 *
 * Emitted into the generated module so discovery can place the file without
 * evaluating it, and read here too so the watcher can report a move.
 */
export function parseNavPath(source: string): string | null {
  return source.match(NAV_PATTERN)?.[1] ?? null
}

/** A preview export, as read statically from source. */
export interface ParsedPreview {
  exportName: string
  /** An explicit string-literal label, or null to derive one from the name. */
  label: string | null
  /**
   * The raw source of the preview's `controls` value, or null when it has none.
   *
   * Compared, never emitted: it exists so an edit to a control schema can be told
   * apart from an edit to a render body. The props panel reads `controls` off the
   * object the route loader captured, and a Fast Refresh patch swaps the rendered
   * implementation without replacing that object, so a schema change has to force a
   * reload or the panel keeps describing the previous shape.
   */
  controlsSource: string | null
}

/** Matches `export const <Name> = createPreview(`, capturing the export name. */
const PREVIEW_DECLARATION =
  /^export\s+const\s+([A-Za-z_$][\w$]*)\s*(?::[^=]+)?=\s*createPreview\s*\(/gm

/**
 * Reads the previews a file declares, in the order they are written.
 *
 * This is a static parse: it lets the nav tree be built without evaluating any
 * preview module, which is what keeps each preview in its own lazy chunk rather
 * than the initial bundle. It replaces the older runtime approach, where
 * discovery imported every module and brand-checked each export with
 * `isPreview`.
 *
 * The parse imposes a small authoring convention, which the whole demo already
 * follows: a preview must be `export const <Name> = createPreview(...)` with
 * `createPreview` referenced by that name (not aliased), and an explicit label
 * must be a string literal at the top level of the options object. Anything
 * else, a bare-function preview, a computed label, or a `label` nested inside
 * `controls` or `render`, yields `label: null`, and discovery falls back to a
 * name derived from the export. Exports that are not `createPreview` calls
 * (helpers, `nav`, re-exports) are simply skipped.
 */
export function parsePreviewExports(source: string): ParsedPreview[] {
  const previews: ParsedPreview[] = []

  PREVIEW_DECLARATION.lastIndex = 0
  let match: RegExpExecArray | null
  // biome-ignore lint/suspicious/noAssignInExpressions: the exec/assign loop is the idiom
  while ((match = PREVIEW_DECLARATION.exec(source)) !== null) {
    previews.push({
      exportName: match[1],
      ...extractOptions(source, PREVIEW_DECLARATION.lastIndex),
    })
  }

  return previews
}

/** What one pass over a `createPreview` options object yields. */
type ParsedOptions = Pick<ParsedPreview, 'label' | 'controlsSource'>

const NO_OPTIONS: ParsedOptions = { label: null, controlsSource: null }

/**
 * Reads the `label` and `controls` off the options object of a `createPreview`
 * call, given the index just past its opening `(`.
 *
 * Yields nulls unless the first argument is an object literal carrying those keys
 * at its own top level. The scan skips strings and comments so their braces and
 * quotes cannot throw off the nesting count, and only accepts a key at
 * brace-depth 1, so one nested inside `controls` or a `render` body is ignored.
 * `label` must be a string literal; `controls` is taken as raw source, since it is
 * only ever compared against the previous parse of the same file.
 *
 * The first occurrence of each key wins, matching how the two were read when this
 * only looked for `label`.
 */
function extractOptions(source: string, cursor: number): ParsedOptions {
  let i = cursor
  while (i < source.length && /\s/.test(source[i] ?? '')) i++
  if (source[i] !== '{') return NO_OPTIONS // a bare-function preview, or a non-object arg

  let label: string | null = null
  let controlsSource: string | null = null
  let seenLabel = false
  let seenControls = false
  let depth = 0

  while (i < source.length) {
    const ch = source[i] as string
    const next = source[i + 1]

    if (ch === '/' && next === '/') {
      const newline = source.indexOf('\n', i)
      i = newline === -1 ? source.length : newline + 1
      continue
    }
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      i = end === -1 ? source.length : end + 2
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(source, i) + 1
      continue
    }
    if (ch === '{' || ch === '[' || ch === '(') {
      depth++
      i++
      continue
    }
    if (ch === '}' || ch === ']' || ch === ')') {
      depth--
      if (depth === 0) break // reached the end of the options object
      i++
      continue
    }
    if (depth === 1 && !seenLabel && ch === 'l' && isKeyAt(source, i, 'label')) {
      seenLabel = true
      label = readLabelString(source, i)
      // Step past the key only. Its value is a string, which the branch above
      // skips on the next pass, so nesting stays balanced either way.
      i += 'label'.length
      continue
    }
    if (depth === 1 && !seenControls && ch === 'c' && isKeyAt(source, i, 'controls')) {
      seenControls = true
      const span = readValueSpan(source, i + 'controls'.length)
      if (span) {
        controlsSource = span.text
        // The span is balanced, so `depth` is still 1 on the far side of it.
        i = span.end
        continue
      }
      i += 'controls'.length
      continue
    }
    i++
  }

  return { label, controlsSource }
}

/** True when `name` sits at `i` as a standalone identifier (a key, not part of `labelText`). */
function isKeyAt(source: string, i: number, name: string): boolean {
  if (!source.startsWith(name, i)) return false
  const before = source[i - 1]
  if (before !== undefined && /[\w$]/.test(before)) return false
  const after = source[i + name.length]
  return after === undefined || !/[\w$]/.test(after)
}

/**
 * Reads the raw source of the value following a key, given the index just past
 * the key name.
 *
 * Stops at the comma that ends the property or at the brace that ends the
 * enclosing object, whichever comes first, so the span covers the value and
 * nothing else. Strings and comments are skipped so a comma or brace inside one
 * cannot end the span early. Returns null when no `:` follows, which is what a
 * shorthand property looks like.
 */
function readValueSpan(
  source: string,
  cursor: number
): { text: string; end: number } | null {
  let i = cursor
  while (i < source.length && /\s/.test(source[i] ?? '')) i++
  if (source[i] !== ':') return null
  i++
  while (i < source.length && /\s/.test(source[i] ?? '')) i++

  const start = i
  let depth = 0

  while (i < source.length) {
    const ch = source[i] as string
    const next = source[i + 1]

    if (ch === '/' && next === '/') {
      const newline = source.indexOf('\n', i)
      i = newline === -1 ? source.length : newline + 1
      continue
    }
    if (ch === '/' && next === '*') {
      const end = source.indexOf('*/', i + 2)
      i = end === -1 ? source.length : end + 2
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      i = skipString(source, i) + 1
      continue
    }
    if (ch === '{' || ch === '[' || ch === '(') {
      depth++
      i++
      continue
    }
    if (ch === '}' || ch === ']' || ch === ')') {
      if (depth === 0) break // the brace closing the options object
      depth--
      i++
      continue
    }
    if (ch === ',' && depth === 0) break
    i++
  }

  return { text: source.slice(start, i).trim(), end: i }
}

/** Reads the single- or double-quoted string following a `label` key, or null if the value is not one. */
function readLabelString(source: string, i: number): string | null {
  let j = i + 5 // past 'label'
  while (j < source.length && /\s/.test(source[j] ?? '')) j++
  if (source[j] !== ':') return null
  j++
  while (j < source.length && /\s/.test(source[j] ?? '')) j++

  const quote = source[j]
  // Only literal quotes count; a template literal is treated as computed.
  if (quote !== '"' && quote !== "'") return null

  let value = ''
  for (let k = j + 1; k < source.length; k++) {
    const ch = source[k] as string
    if (ch === '\\') {
      value += source[k + 1] ?? ''
      k++
      continue
    }
    if (ch === quote) return value
    value += ch
  }
  return null
}

/** Returns the index of the closing quote of the string starting at `open`. */
function skipString(source: string, open: number): number {
  const quote = source[open]
  for (let k = open + 1; k < source.length; k++) {
    const ch = source[k]
    if (ch === '\\') {
      k++
      continue
    }
    if (ch === quote) return k
  }
  return source.length
}

/** Strips the magic portion off a glob, leaving the deepest static directory. */
export function globBaseDir(pattern: string): string {
  const segments = pattern.split('/')
  const firstMagic = segments.findIndex((segment) => /[*?[\]{}]/.test(segment))
  const staticSegments =
    firstMagic === -1 ? segments.slice(0, -1) : segments.slice(0, firstMagic)

  return staticSegments.join('/') || '.'
}

/** Absolute glob for a project's previews. Shared so callers cannot disagree. */
export function resolvePreviewsGlob(pattern: string, userRoot: string): string {
  return resolve(userRoot, pattern.replace(/^\.?\//, ''))
}

export interface PreviewMeta {
  nav: string | null
  previews: ParsedPreview[]
}

/**
 * Describes what changed about a preview file, for the reload log.
 *
 * Every case reloads. Vite does not watch the user's project, so nothing else
 * would pick the change up. Labels are compared alongside the export set now
 * that they are read statically and feed the tree, so a label edit is visible.
 */
export function classifyChange(
  previous: PreviewMeta | undefined,
  next: PreviewMeta | null
): string {
  if (next === null) return 'preview removed'
  if (!previous) return 'preview added'
  if (next.nav !== previous.nav) return `moved to ${next.nav}`

  const structureChanged =
    next.previews.length !== previous.previews.length ||
    next.previews.some(
      (p, index) => p.exportName !== previous.previews[index]?.exportName
    )
  if (structureChanged) return 'previews added or reordered'

  const labelChanged = next.previews.some(
    (p, index) => p.label !== previous.previews[index]?.label
  )
  if (labelChanged) return 'label changed'

  // Last, because it is the most expensive comparison and the least common edit.
  const controlsChanged = next.previews.some(
    (p, index) => p.controlsSource !== previous.previews[index]?.controlsSource
  )
  if (controlsChanged) return 'controls changed'

  // The comparison above only sees what the call site spells out. A schema can reach
  // it from elsewhere in the module (`controls: buttonControls`, or a spread of one),
  // and then it reads identically before and after that schema is edited. Judging
  // which spans are self-contained means resolving identifiers, so any file that
  // declares controls at all reloads on every edit instead.
  //
  // That is what these files do today, so nothing regresses; every file without
  // controls is what gains a hot patch. The precise branch above still fires when the
  // change is visible, so the common case reads accurately in the log.
  if (next.previews.some((p) => p.controlsSource !== null)) {
    return 'controls may have changed'
  }

  return 'edited'
}

export function createVirtualModulePlugin(
  previewsPattern: string,
  userRoot: string
): Plugin {
  const searchPattern = resolvePreviewsGlob(previewsPattern, userRoot)
  let lastCount: number | null = null

  // What each file looked like at the last load, so a change can be described.
  const fileMeta = new Map<string, PreviewMeta>()

  return {
    name: 'react-foundry:virtual-previews',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    configureServer(server) {
      const watchDir = globBaseDir(searchPattern)
      if (!existsSync(watchDir)) return

      const handle = (file: string) => {
        const normalizedPath = file.split('\\').join('/')
        const previous = fileMeta.get(normalizedPath)

        let next: PreviewMeta | null = null
        if (existsSync(file)) {
          try {
            const source = readFileSync(file, 'utf-8')
            next = { nav: parseNavPath(source), previews: parsePreviewExports(source) }
          } catch {
            // Mid-write; the next event will carry the finished file.
            return
          }
        }

        // The edited file has to be dropped explicitly. Vite does not watch the
        // user's project, so it would keep serving the previous transform, and
        // a file's `nav` lives in that module rather than the generated one.
        const dropped = invalidateFile(server, file) + invalidateVirtualModule(server)

        console.log(
          pc.green(`  Preview changed (${classifyChange(previous, next)}), reloading`),
          pc.dim(`[${dropped} module(s) invalidated]`)
        )

        // The tree is memoized per module instance, so a hot update alone would
        // leave the shelf showing the previous structure.
        server.ws.send({ type: 'full-reload' })
      }

      // Use fs.watch directly rather than server.watcher. The Vite config puts
      // the user's project root in `watch.ignored`, so Vite never reports
      // changes to preview files and its watcher callbacks never fire. Same
      // reason the config HMR plugin watches the config file this way.
      let debounce: ReturnType<typeof setTimeout> | null = null

      watch(watchDir, { recursive: true }, (_event, filename) => {
        if (!filename) return

        const name = filename.toString()
        if (!name.endsWith('.preview.tsx')) return

        // Editors fire several events per save.
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(() => handle(resolve(watchDir, name)), 50)
      })

      console.log(pc.dim(`  Watching ${watchDir} for preview changes`))
    },

    async load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return

      const files = await glob(searchPattern, { absolute: true })

      // Log on the first load and whenever the count changes, so adding or
      // removing a preview is visible without spamming on every reload.
      if (lastCount !== files.length) {
        console.log(
          pc.green(`  Found ${files.length} preview file${files.length === 1 ? '' : 's'}`)
        )
        lastCount = files.length
      }

      fileMeta.clear()

      const entries = files.flatMap((file) => {
        const normalizedPath = file.split('\\').join('/')

        // A file deleted between the glob and this read would otherwise throw
        // out of the hook and take the whole module with it.
        let source: string
        try {
          source = readFileSync(file, 'utf-8')
        } catch {
          return []
        }

        const nav = parseNavPath(source)
        const previews = parsePreviewExports(source)
        fileMeta.set(normalizedPath, { nav, previews })

        // The static parse only sees `export const X = createPreview(...)`. A
        // file that calls createPreview some other way (aliased, wrapped, or
        // re-exported) would silently show no previews, so say so.
        if (previews.length === 0 && source.includes('createPreview')) {
          console.log(
            pc.yellow(
              `  ${normalizedPath} calls createPreview but no preview was detected. Author each as \`export const X = createPreview(...)\`.`
            )
          )
        }

        return [{ normalizedPath, nav, previews }]
      })

      return generateModuleSource(entries)
    },
  }
}

export interface ModuleEntry {
  normalizedPath: string
  nav: string | null
  previews: ParsedPreview[]
}

/**
 * Emits the virtual module: a map keyed by absolute path, each entry carrying
 * the file's statically parsed metadata and a `load` thunk that dynamically
 * imports it.
 *
 * The dynamic `import()` is the point: it is a code-split boundary, so each
 * preview file becomes its own chunk instead of riding in the initial bundle.
 * Everything else (nav, previews) is a plain JSON value, so discovery builds the
 * tree without ever evaluating a preview module.
 *
 * Paths and metadata go through `JSON.stringify` so a path containing a quote
 * produces valid source rather than a broken module.
 *
 * Only the two fields discovery reads are emitted. `controlsSource` is parsed for
 * change detection on the server and would otherwise ship a copy of every control
 * schema to the browser for nothing.
 */
export function generateModuleSource(entries: ModuleEntry[]): string {
  const moduleObject = entries
    .map(({ normalizedPath, nav, previews }) => {
      const leaves = previews.map(({ exportName, label }) => ({ exportName, label }))

      return `  ${JSON.stringify(normalizedPath)}: { nav: ${JSON.stringify(nav)}, previews: ${JSON.stringify(leaves)}, load: () => import(${JSON.stringify(normalizedPath)}) },`
    })
    .join('\n')

  return `const previewModules = {
${moduleObject}
};

export default previewModules;
`
}

/** The shape of a module graph node this file needs: an id and its importers. */
interface GraphModule {
  id: string | null
  importers: Set<GraphModule>
}

/**
 * Drops a module and everything that imports it, recording each id in `seen`.
 *
 * Importers matter because foundry's app memoizes at module scope: discovery
 * reads the generated modules once and caches the tree, so leaving an importer
 * cached serves the old structure even after a refresh.
 */
function invalidateWithImporters(
  server: ViteDevServer,
  mod: GraphModule,
  seen: Set<string>
): void {
  if (!mod.id || seen.has(mod.id)) return
  seen.add(mod.id)

  server.moduleGraph.invalidateModule(mod as never)
  for (const importer of mod.importers) invalidateWithImporters(server, importer, seen)
}

/**
 * Drops the modules Vite holds for a file on disk, and their importers,
 * returning how many.
 *
 * Vite does not watch the user's project (nor the cache dir the config module is
 * written into), so without this it serves a stale transform even across a full
 * page reload.
 */
export function invalidateFile(server: ViteDevServer, file: string): number {
  const mods = server.moduleGraph.getModulesByFile(file)
  if (!mods) return 0

  const seen = new Set<string>()
  for (const mod of mods) {
    invalidateWithImporters(server, mod as unknown as GraphModule, seen)
  }

  return seen.size
}

/**
 * Drops the generated previews module and everything that imports it, returning
 * how many.
 */
export function invalidateVirtualModule(server: ViteDevServer): number {
  const mod =
    server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID) ??
    server.moduleGraph.getModuleById(VIRTUAL_MODULE_ID)

  if (!mod) return 0

  const seen = new Set<string>()
  invalidateWithImporters(server, mod as unknown as GraphModule, seen)

  return seen.size
}
