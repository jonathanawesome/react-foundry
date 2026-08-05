import { existsSync, readFileSync, watch } from 'node:fs'
import { resolve } from 'node:path'
import pc from 'picocolors'
import type { Plugin } from 'vite'
import { importUserConfig } from '../config/import-config'
import { findConfigPath } from '../config/load-config'
import { invalidateFile } from './virtual-module-plugin'
import { CONFIG_MODULE_FILE_NAME, writeFoundryConfig } from './write-foundry-config'
import { writeNavTypes } from './write-nav-types'

export function createConfigHmrPlugin(userRoot: string, cacheDir: string): Plugin {
  return {
    name: 'react-foundry:config-hmr',
    configureServer(server) {
      const configPath = findConfigPath(userRoot)
      if (!configPath) return

      // What the generated config module last held. Seeded from the copy the Vite
      // config already wrote at startup, so the first edit is compared against what
      // the running app actually loaded rather than treated as a change by default.
      const configModulePath = resolve(cacheDir, CONFIG_MODULE_FILE_NAME)
      let lastConfigSource = existsSync(configModulePath)
        ? readFileSync(configModulePath, 'utf-8')
        : null

      let debounceTimer: ReturnType<typeof setTimeout> | null = null

      // Use fs.watch directly: Vite's watcher ignores the user's project root.
      watch(configPath, (eventType) => {
        if (eventType !== 'change') return

        // Debounce to handle editors that fire multiple write events.
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          try {
            // Re-load through the same esbuild-to-file path as startup. The mtime in
            // the emitted filename busts the module cache; importing `react-foundry`
            // is now safe (side-effect-free public entry), so no shim is needed.
            const userConfig = await importUserConfig(configPath, cacheDir)

            const { configPath: configCachePath, themePath } = writeFoundryConfig(
              {
                theme: userConfig.theme as never,
                title: userConfig.title as string | undefined,
                nav: userConfig.nav as never,
              },
              cacheDir
            )

            // Regenerate the NavPath union too, so the running app doesn't offer a
            // path TypeScript still rejects. `navTypes: false` passes no tree, which
            // removes the file rather than leaving a stale union behind.
            const navForTypes =
              userConfig.navTypes === false ? undefined : (userConfig.nav as never)

            writeNavTypes(navForTypes, userRoot, {
              previews: userConfig.previews as string | undefined,
              navTypesPath: userConfig.navTypesPath as string | undefined,
            })

            // The theme sheet is plain CSS, so handing it to Vite's own HMR pipeline
            // hot-swaps it with no reload. That is the common case while tuning colors.
            server.watcher.emit('change', themePath)

            const configSource = readFileSync(configCachePath, 'utf-8')
            const navOrTitleChanged = configSource !== lastConfigSource
            lastConfigSource = configSource

            if (navOrTitleChanged) {
              // `nav` and `title` need a reload rather than an HMR update. The cache dir
              // sits under the user's root, which the Vite config puts in `watch.ignored`,
              // so the module has to be dropped by hand. Its importers go with it because
              // `app/nav.ts` builds discovery at module scope and memoizes the tree, which
              // is what left the shelf rendering the previous tree after a `nav` edit.
              const dropped = invalidateFile(server, configCachePath)
              server.ws.send({ type: 'full-reload' })

              console.log(
                pc.green('  Config reloaded'),
                pc.dim(`[${dropped} module(s) invalidated]`)
              )
            } else {
              console.log(pc.green('  Theme reloaded'))
            }
          } catch (error) {
            console.error(pc.yellow('  Failed to reload config:'), error)
          }
        }, 100)
      })
    },
  }
}
