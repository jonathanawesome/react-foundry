import { readFileSync, watch } from 'node:fs'
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

            const { configPath: configCachePath, themePath } = writeFoundryConfig(
              {
                theme: userConfig.theme,
                title: userConfig.title,
                nav: userConfig.nav,
              },
              cacheDir
            )

            // Regenerate the NavPath union too, so the running app doesn't offer a
            // path TypeScript still rejects.
            writeNavTypes(userConfig.nav, userRoot)

            // Hand both regenerated files to Vite's own HMR pipeline. The theme
            // sheet is plain CSS, so it hot-swaps with no reload; the config module
            // (title/nav) updates its importers, or Vite falls back to a reload.
            // themes.css.ts no longer depends on config, so the old blanket
            // `.css.ts` invalidation is gone.
            server.watcher.emit('change', themePath)
            server.watcher.emit('change', configCachePath)

            console.log(pc.green('  Config reloaded'))
          } catch (error) {
            console.error(pc.yellow('  Failed to reload config:'), error)
          }
        }, 100)
      })
    },
  }
}
