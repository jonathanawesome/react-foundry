import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import pc from 'picocolors'
import type { Plugin } from 'vite'
import { findConfigPath } from '../config/load-config'
import { writeFoundryConfig } from './write-foundry-config'

export function createConfigHmrPlugin(userRoot: string, cacheDir: string): Plugin {
  return {
    name: 'react-foundry:config-hmr',
    configureServer(server) {
      const configPath = findConfigPath(userRoot)
      if (!configPath) return

      server.watcher.add(configPath)

      server.watcher.on('change', async (changedPath) => {
        if (resolve(changedPath) !== resolve(configPath)) return

        try {
          const configUrl = `${pathToFileURL(configPath).href}?t=${Date.now()}`
          const configModule = await import(configUrl)
          const userConfig = configModule.default || {}

          writeFoundryConfig(userConfig.theme, userConfig.title, cacheDir)

          console.log(pc.green('  Config reloaded'))
        } catch (error) {
          console.error(pc.yellow('  Failed to reload config:'), error)
        }
      })
    },
  }
}
