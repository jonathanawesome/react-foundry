import { readFileSync } from 'node:fs'
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

  return {
    name: 'react-foundry:virtual-previews',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },

    configureServer(server) {
      // Vite's own watcher ignores the user's project root, so watch the
      // previews directory directly. Without this, adding or deleting a preview
      // file leaves the nav stale until the server restarts.
      const watchDir = globBaseDir(searchPattern)

      const invalidate = (file: string) => {
        if (!file.endsWith('.preview.tsx')) return

        invalidateVirtualModule(server)
        server.ws.send({ type: 'full-reload' })
      }

      server.watcher.add(watchDir)
      server.watcher.on('add', invalidate)
      server.watcher.on('unlink', invalidate)
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

      const entries = files.map((file, index) => {
        const normalizedPath = file.split('\\').join('/')
        const exportOrder = parseExportOrder(readFileSync(file, 'utf-8'))

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

function invalidateVirtualModule(server: ViteDevServer) {
  const mod = server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_MODULE_ID)
  if (mod) server.moduleGraph.invalidateModule(mod)
}
