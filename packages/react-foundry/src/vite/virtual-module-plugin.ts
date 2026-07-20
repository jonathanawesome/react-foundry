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
      label: extractOptionsLabel(source, PREVIEW_DECLARATION.lastIndex),
    })
  }

  return previews
}

/**
 * Reads a string-literal `label` off the options object of a `createPreview`
 * call, given the index just past its opening `(`.
 *
 * Returns null unless the first argument is an object literal carrying a
 * `label: '...'` at its own top level. The scan skips strings and comments so
 * their braces and quotes cannot throw off the nesting count, and only accepts
 * a `label` key at brace-depth 1, so one nested inside `controls` or a `render`
 * body is ignored.
 */
function extractOptionsLabel(source: string, cursor: number): string | null {
  let i = cursor
  while (i < source.length && /\s/.test(source[i] ?? '')) i++
  if (source[i] !== '{') return null // a bare-function preview, or a non-object arg

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
      if (depth === 0) return null // reached the end of the options object
      i++
      continue
    }
    if (depth === 1 && ch === 'l' && isLabelKey(source, i)) {
      return readLabelString(source, i)
    }
    i++
  }

  return null
}

/** True when `label` sits at `i` as a standalone identifier (a key, not part of `labelText`). */
function isLabelKey(source: string, i: number): boolean {
  if (!source.startsWith('label', i)) return false
  const before = source[i - 1]
  if (before !== undefined && /[\w$]/.test(before)) return false
  const after = source[i + 5]
  return after === undefined || !/[\w$]/.test(after)
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
 */
export function generateModuleSource(entries: ModuleEntry[]): string {
  const moduleObject = entries
    .map(
      ({ normalizedPath, nav, previews }) =>
        `  ${JSON.stringify(normalizedPath)}: { nav: ${JSON.stringify(nav)}, previews: ${JSON.stringify(previews)}, load: () => import(${JSON.stringify(normalizedPath)}) },`
    )
    .join('\n')

  return `const previewModules = {
${moduleObject}
};

export default previewModules;
`
}

/**
 * Drops the modules Vite holds for a file on disk, returning how many.
 *
 * Vite does not watch the user's project, so without this it serves a stale
 * transform even across a full page reload.
 */
export function invalidateFile(server: ViteDevServer, file: string): number {
  const mods = server.moduleGraph.getModulesByFile(file)
  if (!mods) return 0

  for (const mod of mods) server.moduleGraph.invalidateModule(mod)

  return mods.size
}

/**
 * Drops the generated module and everything that imports it, returning how many.
 *
 * Importers matter: discovery reads the module once and memoizes the tree, so
 * leaving those cached serves the old structure even after a refresh.
 */
export function invalidateVirtualModule(server: ViteDevServer): number {
  const mod =
    server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID) ??
    server.moduleGraph.getModuleById(VIRTUAL_MODULE_ID)

  if (!mod) return 0

  const seen = new Set<string>()

  const invalidate = (target: typeof mod) => {
    if (!target.id || seen.has(target.id)) return
    seen.add(target.id)

    server.moduleGraph.invalidateModule(target)
    for (const importer of target.importers) invalidate(importer)
  }

  invalidate(mod)
  return seen.size
}
