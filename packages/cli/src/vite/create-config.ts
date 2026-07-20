import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import type { InlineConfig } from 'vite'
import type { ResolvedFoundryConfig } from '../types'
import { createConfigHmrPlugin } from './config-hmr-plugin'
import { createVirtualModulePlugin, resolvePreviewsGlob } from './virtual-module-plugin'
import { writeFoundryConfig } from './write-foundry-config'
import { writeNavTypes } from './write-nav-types'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cliAppDir = resolve(__dirname, '../../src/app')

export function createViteConfig(
  config: ResolvedFoundryConfig,
  root: string
): InlineConfig {
  // Find the monorepo root (go up from CLI package to root)
  const monorepoRoot = resolve(__dirname, '../../../../')

  // Write config to a real file so vanilla-extract's child compiler can resolve it
  const cacheDir = resolve(root, 'node_modules', '.cache', 'react-foundry')
  const { configPath, themePath } = writeFoundryConfig(
    { theme: config.theme, title: config.title, nav: config.nav },
    cacheDir
  )

  // Emit the NavPath union so preview files typecheck their `nav` against the
  // declared tree. Lands in the user's project so their editor picks it up.
  writeNavTypes(config.nav, root)

  // Pulled apart so a user override merges into each section rather than
  // replacing it. Setting `server.host` must not drop `server.watch.ignored`,
  // which the previews and config watchers depend on.
  const {
    plugins: userPlugins,
    resolve: userResolve,
    server: userServer,
    optimizeDeps: userOptimizeDeps,
    build: userBuild,
    ...userViteConfig
  } = config.viteConfig || {}

  return {
    root: cliAppDir, // Use CLI app dir as Vite root
    plugins: [
      createConfigHmrPlugin(root, cacheDir),
      createVirtualModulePlugin(config.previews, root),
      react(),
      tanstackRouter({
        routesDirectory: resolve(cliAppDir, 'routes'),
        generatedRouteTree: resolve(cliAppDir, 'routeTree.gen.ts'),
      }),
      vanillaExtractPlugin(),
      ...(userPlugins || []),
    ],
    resolve: {
      ...userResolve,
      alias: {
        ...(typeof userResolve?.alias === 'object' && !Array.isArray(userResolve.alias)
          ? userResolve.alias
          : {}),
        'virtual:react-foundry-config': configPath,
        'virtual:react-foundry-theme': themePath,
      },
    },
    server: {
      port: config.port,
      host: config.host,
      ...userServer,
      fs: {
        allow: [monorepoRoot, cacheDir],
        strict: false,
        ...userServer?.fs,
      },
      watch: {
        // Excludes the user's project from Vite's watcher. Previews and config
        // are watched with `fs.watch` in their own plugins instead, since those
        // rebuild generated artifacts rather than just triggering an update.
        //
        // A `'!**/node_modules/**'` entry used to sit here. Leading `!` is a
        // picomatch negation, so as an ignore pattern it meant "ignore
        // everything outside node_modules", leaving Vite watching almost nothing.
        ignored: [`${root}/**/*`],
        ...userServer?.watch,
      },
    },
    optimizeDeps: {
      entries: [resolvePreviewsGlob(config.previews, root)],
      // Generated config lives under node_modules/.cache, so Vite would
      // pre-bundle it and keep serving that copy after it is regenerated.
      exclude: ['virtual:react-foundry-config', 'virtual:react-foundry-theme'],
      ...userOptimizeDeps,
    },
    build: {
      outDir: resolve(root, 'dist'),
      ...userBuild,
    },
    publicDir: resolve(cliAppDir, 'public'),
    ...userViteConfig,
  }
}
