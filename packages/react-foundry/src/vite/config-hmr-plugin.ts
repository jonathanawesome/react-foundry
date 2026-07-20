import { watch } from 'node:fs'
import pc from 'picocolors'
import type { Plugin } from 'vite'
import { importUserConfig } from '../config/import-config'
import { findConfigPath } from '../config/load-config'
import { writeFoundryConfig } from './write-foundry-config'
import { writeNavTypes } from './write-nav-types'

export function createConfigHmrPlugin(userRoot: string, cacheDir: string): Plugin {
  return {
    name: 'react-foundry:config-hmr',
    configureServer(server) {
      const configPath = findConfigPath(userRoot)
      if (!configPath) return

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
            // path TypeScript still rejects.
            writeNavTypes(userConfig.nav as never, userRoot)

            // Hand both regenerated files to Vite's own HMR pipeline. The theme sheet
            // is plain CSS, so it hot-swaps with no reload; the config module (title/
            // nav) updates its importers, or Vite falls back to a reload.
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
