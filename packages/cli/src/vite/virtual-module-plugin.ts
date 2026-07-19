import { existsSync, readFileSync, watch } from 'node:fs'
import { resolve } from 'node:path'
import { glob } from 'glob'
import pc from 'picocolors'
import type { Plugin, ViteDevServer } from 'vite'

const VIRTUAL_MODULE_ID = 'virtual:react-foundry-previews'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

/**
 * Matches the start of a value export declaration, capturing its name.
 *
 * Deliberately narrow: `export default` and `export { ... }` re-exports are not
 * previews, and `export type`/`export interface` do not exist at runtime.
 */
const EXPORT_PATTERN =
  /^export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+([A-Za-z_$][\w$]*)/gm

/**
 * Reads the order exports are written in, which is the order their previews
 * appear in the nav.
 *
 * This cannot be recovered at runtime: the ES spec requires the keys of a
 * module namespace object (`import * as m`) to be sorted alphabetically, so by
 * the time discovery sees the module the authored order is gone. Hence reading
 * it off the source here.
 *
 * Preview files are a narrow, conventional subset of TypeScript, so a pattern
 * match is enough. If that stops holding, swap in `es-module-lexer`, which Vite
 * already depends on.
 */
export function parseExportOrder(source: string): string[] {
  return [...source.matchAll(EXPORT_PATTERN)].map((match) => match[1])
}

/** Matches `export const nav = '...'`, with or without a type annotation. */
const NAV_PATTERN = /^export\s+const\s+nav\s*(?::[^=]+)?=\s*['"]([^'"]*)['"]/m

/**
 * Reads a file's declared nav path, which decides where its previews sit.
 *
 * Note this value is *not* emitted into the generated module, which carries
 * only paths and export order. Discovery reads `nav` off the preview module
 * itself at runtime. It is parsed here so the watcher can report what changed.
 */
export function parseNavPath(source: string): string | null {
  return source.match(NAV_PATTERN)?.[1] ?? null
}

/** Strips the magic portion off a glob, leaving the deepest static directory. */
export function globBaseDir(pattern: string): string {
  const segments = pattern.split('/')
  const firstMagic = segments.findIndex((segment) => /[*?[\]{}]/.test(segment))
  const staticSegments =
    firstMagic === -1 ? segments.slice(0, -1) : segments.slice(0, firstMagic)

  return staticSegments.join('/') || '.'
}

export function createVirtualModulePlugin(
  previewsPattern: string,
  userRoot: string
): Plugin {
  // Ensure pattern doesn't start with / or ./
  const cleanPattern = previewsPattern.replace(/^\.?\//, '')
  const searchPattern = resolve(userRoot, cleanPattern)
  let lastCount: number | null = null

  // What was baked into the module the browser currently holds, so a file change
  // can be compared against it rather than blindly forcing a reload.
  const fileMeta = new Map<string, { nav: string | null; exportOrder: string[] }>()

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

      const reload = (file: string, reason: string) => {
        // The edited preview file has to be dropped explicitly. Vite's watcher
        // ignores the user's project, so it never learns the file changed and
        // otherwise keeps serving the previously transformed copy. A file's
        // `nav` export lives in that module, not in the generated one, so
        // invalidating only the virtual module changes nothing.
        const dropped = invalidateFile(server, file) + invalidateVirtualModule(server)

        console.log(
          pc.green(`  Preview changed (${reason}), reloading`),
          pc.dim(`[${dropped} module(s) invalidated]`)
        )

        // The nav tree is memoized per module instance, so a hot update alone
        // would leave the shelf showing the previous structure.
        server.ws.send({ type: 'full-reload' })
      }

      const handle = (file: string) => {
        const normalizedPath = file.split('\\').join('/')
        const previous = fileMeta.get(normalizedPath)

        if (!existsSync(file)) return reload(file, 'preview removed')
        if (!previous) return reload(file, 'preview added')

        let source: string
        try {
          source = readFileSync(file, 'utf-8')
        } catch {
          return
        }

        const nav = parseNavPath(source)
        const exportOrder = parseExportOrder(source)

        if (nav !== previous.nav) return reload(file, `moved to ${nav}`)

        const orderChanged =
          exportOrder.length !== previous.exportOrder.length ||
          exportOrder.some((name, index) => name !== previous.exportOrder[index])

        if (orderChanged) return reload(file, 'previews added or reordered')

        // Ordinary edits to a preview's markup still need the file dropped, for
        // the same reason: nothing else is watching it.
        reload(file, 'edited')
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

      const entries = files.map((file, index) => {
        const normalizedPath = file.split('\\').join('/')
        const source = readFileSync(file, 'utf-8')
        const exportOrder = parseExportOrder(source)

        fileMeta.set(normalizedPath, { nav: parseNavPath(source), exportOrder })

        return { normalizedPath, index, exportOrder }
      })

      const imports = entries
        .map(
          ({ normalizedPath, index }) =>
            `import * as module${index} from '${normalizedPath}';`
        )
        .join('\n')

      const moduleObject = entries
        .map(
          ({ normalizedPath, index, exportOrder }) =>
            `  '${normalizedPath}': { module: module${index}, exportOrder: ${JSON.stringify(exportOrder)} },`
        )
        .join('\n')

      return `${imports}

const previewModules = {
${moduleObject}
};

export default previewModules;
`
    },
  }
}

/**
 * Drops the modules Vite holds for a file on disk, returning how many.
 *
 * Needed because the user's project is excluded from Vite's watcher, so Vite
 * never invalidates preview files on its own and would serve a stale transform
 * even across a full page reload.
 */
function invalidateFile(server: ViteDevServer, file: string): number {
  const mods = server.moduleGraph.getModulesByFile(file)
  if (!mods) return 0

  for (const mod of mods) server.moduleGraph.invalidateModule(mod)

  return mods.size
}

/**
 * Drops the generated module and everything that imports it, returning how many
 * modules were dropped.
 *
 * The importers matter: discovery reads the module once and memoizes the tree,
 * so leaving those cached serves the old structure even after a refresh.
 *
 * Looks the module up by both its resolved and unresolved id. Vite keys virtual
 * modules by the null-prefixed id, but only once something has actually
 * imported them, so a lookup that finds nothing is worth reporting rather than
 * swallowing.
 */
function invalidateVirtualModule(server: ViteDevServer): number {
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
