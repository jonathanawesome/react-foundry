import { existsSync, readFileSync, watch } from 'node:fs'
import { resolve } from 'node:path'
import pc from 'picocolors'
import type { Plugin, ViteDevServer } from 'vite'
import { importUserConfig } from '../config/import-config'
import { findConfigPath } from '../config/load-config'
import { invalidateFile } from './virtual-module-plugin'
import { CONFIG_MODULE_FILE_NAME, writeFoundryConfig } from './write-foundry-config'
import { writeNavTypes } from './write-nav-types'

/** What one reload did, so the caller can report it and compare the next one against it. */
export interface ConfigReloadResult {
  /** The regenerated config module's source. Feed it back as `lastConfigSource`. */
  configSource: string
  /** True when `nav` or `title` moved, so the page was reloaded rather than hot-swapped. */
  reloaded: boolean
  /** Modules dropped from Vite's graph. Zero on a theme-only edit, which drops nothing. */
  dropped: number
  /** Where the `NavPath` union landed, or null when nothing was emitted. */
  navTypesPath: string | null
}

export interface ConfigReloadOptions {
  /** The user's `foundry.config.*`, as found by {@link findConfigPath}. */
  configPath: string
  userRoot: string
  cacheDir: string
  /**
   * What the generated config module held at the last reload. A theme-only edit rewrites
   * it byte for byte, which is how those are told apart from a `nav` or `title` change.
   */
  lastConfigSource: string | null
}

/** The config module's path, knowable before it is (re)written. */
export function configModulePath(cacheDir: string): string {
  return resolve(cacheDir, CONFIG_MODULE_FILE_NAME)
}

/**
 * Seeds the comparison from the copy `createViteConfig` already wrote at startup, so the
 * first edit is measured against what the running app actually loaded rather than being
 * treated as a change by default.
 */
export function readSeedConfigSource(cacheDir: string): string | null {
  const path = configModulePath(cacheDir)
  return existsSync(path) ? readFileSync(path, 'utf-8') : null
}

/**
 * Re-reads the user's config, regenerates everything derived from it, and tells the
 * browser what to do about it.
 *
 * Split out from the watcher so it can be exercised directly: the watcher is `fs.watch`
 * inside `configureServer`, which no test can reach. Deliberately silent, leaving the
 * reporting to the caller.
 */
export async function applyConfigChange(
  server: ViteDevServer,
  { configPath, userRoot, cacheDir, lastConfigSource }: ConfigReloadOptions
): Promise<ConfigReloadResult> {
  // Re-load through the same esbuild-to-file path as startup. The mtime in the emitted
  // filename busts the module cache; importing `react-foundry` is safe (side-effect-free
  // public entry), so no shim is needed.
  const userConfig = await importUserConfig(configPath, cacheDir)

  const { configPath: configCachePath, themePath } = writeFoundryConfig(
    {
      theme: userConfig.theme as never,
      title: userConfig.title as string | undefined,
      nav: userConfig.nav as never,
    },
    cacheDir
  )

  // Regenerate the NavPath union too, so the running app doesn't offer a path TypeScript
  // still rejects. `navTypes: false` passes no tree, which removes the file rather than
  // leaving a stale union behind.
  const navForTypes =
    userConfig.navTypes === false ? undefined : (userConfig.nav as never)

  const navTypesPath = writeNavTypes(navForTypes, userRoot, {
    previews: userConfig.previews as string | undefined,
    navTypesPath: userConfig.navTypesPath as string | undefined,
  })

  // The theme sheet is plain CSS, so handing it to Vite's own HMR pipeline hot-swaps it
  // with no reload. That is the common case while tuning colors.
  server.watcher.emit('change', themePath)

  const configSource = readFileSync(configCachePath, 'utf-8')
  if (configSource === lastConfigSource) {
    return { configSource, reloaded: false, dropped: 0, navTypesPath }
  }

  // `nav` and `title` need a reload rather than an HMR update. The cache dir sits under
  // node_modules, which Vite's watcher ignores by default, so the module has to be
  // dropped by hand. Its importers go with it because `app/nav.ts` builds discovery at
  // module scope and memoizes the tree, which is what left the shelf rendering the
  // previous tree after a `nav` edit.
  const dropped = invalidateFile(server, configCachePath)
  server.ws.send({ type: 'full-reload' })

  return { configSource, reloaded: true, dropped, navTypesPath }
}

export function createConfigHmrPlugin(userRoot: string, cacheDir: string): Plugin {
  return {
    name: 'react-foundry:config-hmr',
    configureServer(server) {
      const configPath = findConfigPath(userRoot)
      if (!configPath) return

      let lastConfigSource = readSeedConfigSource(cacheDir)
      let debounceTimer: ReturnType<typeof setTimeout> | null = null

      // Use fs.watch directly: the config is esbuild-bundled to the cache dir rather
      // than imported by the app, so it never enters the module graph and Vite's
      // watcher never picks it up.
      watch(configPath, (eventType) => {
        if (eventType !== 'change') return

        // Debounce to handle editors that fire multiple write events.
        if (debounceTimer) clearTimeout(debounceTimer)
        debounceTimer = setTimeout(async () => {
          try {
            const result = await applyConfigChange(server, {
              configPath,
              userRoot,
              cacheDir,
              lastConfigSource,
            })
            lastConfigSource = result.configSource

            if (result.reloaded) {
              console.log(
                pc.green('  Config reloaded'),
                pc.dim(`[${result.dropped} module(s) invalidated]`)
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
