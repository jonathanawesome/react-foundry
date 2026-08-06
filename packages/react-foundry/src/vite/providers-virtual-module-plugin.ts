import { existsSync, watch } from 'node:fs'
import { resolve } from 'node:path'
import pc from 'picocolors'
import type { Plugin, ViteDevServer } from 'vite'
import { invalidateFile } from './virtual-module-plugin'

const VIRTUAL_MODULE_ID = 'virtual:react-foundry-providers'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

/** Names a consumer may give their providers file, at the project root, most specific first. */
export const PROVIDERS_FILE_NAMES = [
  'foundry.providers.tsx',
  'foundry.providers.jsx',
  'foundry.providers.ts',
  'foundry.providers.js',
]

/** The consumer's providers file at the project root, or null when they have none. */
export function findProvidersPath(root: string): string | null {
  for (const name of PROVIDERS_FILE_NAMES) {
    const full = resolve(root, name)
    if (existsSync(full)) return full
  }
  return null
}

/**
 * Emits the providers virtual module: re-exports the consumer's `Provider`, or a
 * passthrough when they have not authored one.
 *
 * A namespace import with a runtime fallback, rather than `export { Provider } from`,
 * so a file that exists but omits (or misspells) the export degrades to the passthrough
 * instead of a hard "no matching export" build error. The path goes through
 * `JSON.stringify` so a backslash or quote produces valid source.
 */
export function generateProvidersModuleSource(resolvedPath: string | null): string {
  if (!resolvedPath) {
    return 'export const Provider = ({ children }) => children;\n'
  }

  return `import * as _providers from ${JSON.stringify(resolvedPath)};
export const Provider = _providers.Provider ?? (({ children }) => children);
`
}

/**
 * Surfaces the consumer's `foundry.providers.tsx` `Provider` as
 * `virtual:react-foundry-providers`, so the app tree can wrap every preview in it.
 *
 * A `resolveId`/`load` plugin (not a file alias like config/theme) because a Provider
 * is a real React component, not a serializable value. Resolves to a `\0`-prefixed id,
 * which the dep optimizer skips, so no `optimizeDeps.exclude` entry is needed.
 */
export function createProvidersVirtualModulePlugin(userRoot: string): Plugin {
  return {
    name: 'react-foundry:virtual-providers',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
    },
    load(id) {
      if (id !== RESOLVED_VIRTUAL_MODULE_ID) return
      return generateProvidersModuleSource(findProvidersPath(userRoot))
    },
    configureServer(server) {
      let debounce: ReturnType<typeof setTimeout> | null = null

      // fs.watch, not server.watcher: a providers file the consumer has not created
      // yet is not in the module graph, so Vite's watcher would never report it
      // appearing. Watch the root non-recursively, filtering by filename since every
      // root child fires here.
      watch(userRoot, { recursive: false }, (_event, filename) => {
        if (!filename) return
        if (!PROVIDERS_FILE_NAMES.includes(filename.toString())) return

        // Editors fire several events per save.
        if (debounce) clearTimeout(debounce)
        debounce = setTimeout(() => {
          // Drop both the consumer file and the virtual module. An edit that keeps the
          // same resolved path re-emits byte-identical virtual source, so invalidating
          // the virtual module alone would keep serving the stale consumer transform.
          const path = findProvidersPath(userRoot)
          let dropped = invalidateVirtualModule(server)
          if (path) dropped += invalidateFile(server, path)

          console.log(
            pc.green('  Providers changed, reloading'),
            pc.dim(`[${dropped} module(s) invalidated]`)
          )

          // The provider wraps every canvas, so a hot update would leave stale ones.
          server.ws.send({ type: 'full-reload' })
        }, 50)
      })
    },
  }
}

/** Drops the providers virtual module and everything that imports it, returning how many. */
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
