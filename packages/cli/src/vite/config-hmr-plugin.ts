import { readFileSync, watch } from 'node:fs'
import { resolve } from 'node:path'
import pc from 'picocolors'
import { type Plugin, transformWithEsbuild } from 'vite'
import { findConfigPath } from '../config/load-config'
import { writeFoundryConfig } from './write-foundry-config'
import { writeNavTypes } from './write-nav-types'

/** Matches an `import { ... } from '@react-foundry/cli'`, braces spanning lines. */
const CLI_IMPORT = /import\s*\{[^}]*\}\s*from\s*['"]@react-foundry\/cli['"]\s*;?/g

/**
 * Replaces the CLI import in a config file with an inline `defineConfig` shim.
 *
 * The config is re-imported on every save to read its new values, but importing
 * `@react-foundry/cli` for real would run the binary's entry point, which calls
 * `cli.parse()` and re-triggers server startup. `defineConfig` is a passthrough,
 * so a local stub is enough.
 */
export function shimConfigSource(source: string): string {
  return source.replace(CLI_IMPORT, 'const defineConfig = (c) => c;')
}

export function createConfigHmrPlugin(userRoot: string, cacheDir: string): Plugin {
  return {
    name: 'react-foundry:config-hmr',
    configureServer(server) {
      const configPath = findConfigPath(userRoot)
      if (!configPath) return

      let debounceTimer: ReturnType<typeof setTimeout> | null = null

      // Use fs.watch directly — Vite's watcher ignores the user's project root
      watch(configPath, (eventType) => {
        if (eventType !== 'change') return

        // Debounce to handle editors that fire multiple write events
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          try {
            // Read + transform the config ourselves. We can't use import() (tsx
            // caches by file path) or ssrLoadModule (the CLI entry point has
            // side effects — cli.parse() — that re-trigger server startup).
            const source = readFileSync(configPath, 'utf-8')
            const shimmed = shimConfigSource(source)

            const result = await transformWithEsbuild(shimmed, configPath, {
              loader: 'ts',
              format: 'esm',
            })

            const dataUrl = `data:text/javascript;base64,${Buffer.from(result.code).toString('base64')}`
            const configModule = await import(/* @vite-ignore */ dataUrl)
            const userConfig = configModule.default || {}

            writeFoundryConfig(
              {
                theme: userConfig.theme,
                title: userConfig.title,
                nav: userConfig.nav,
              },
              cacheDir
            )

            // Regenerate the NavPath union too. The shelf picks up a nav change
            // on the reload below, so without this the running app would offer
            // a path that TypeScript still rejects.
            writeNavTypes(userConfig.nav, userRoot)

            // Invalidate the generated cache file so Vite re-reads it on reload
            const cacheFile = resolve(cacheDir, 'react-foundry-config.js')
            const cacheModules = server.moduleGraph.getModulesByFile(cacheFile)
            if (cacheModules) {
              for (const mod of cacheModules) {
                server.moduleGraph.invalidateModule(mod)
              }
            }

            // Invalidate .css.ts modules so vanilla-extract recompiles them.
            // vanilla-extract's transform consumes the original imports, so
            // Vite's module graph has no edge from .css.ts → cache file.
            for (const [file, mods] of server.moduleGraph.fileToModulesMap) {
              if (file.endsWith('.css.ts')) {
                for (const mod of mods) {
                  server.moduleGraph.invalidateModule(mod)
                }
              }
            }

            server.ws.send({ type: 'full-reload' })

            console.log(pc.green('  Config reloaded'))
          } catch (error) {
            console.error(pc.yellow('  Failed to reload config:'), error)
          }
        }, 100)
      })
    },
  }
}
