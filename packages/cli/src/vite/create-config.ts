import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import type { InlineConfig } from 'vite'
import type { ResolvedFoundryConfig } from '../types'
import { createConfigHmrPlugin } from './config-hmr-plugin'
import { createVirtualModulePlugin } from './virtual-module-plugin'
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
  const configFilePath = writeFoundryConfig(
    { theme: config.theme, title: config.title, nav: config.nav },
    cacheDir
  )

  // Emit the NavPath union so preview files typecheck their `nav` against the
  // declared tree. Lands in the user's project so their editor picks it up.
  writeNavTypes(config.nav, root)

  const {
    plugins: userPlugins,
    resolve: userResolve,
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
        'virtual:react-foundry-config': configFilePath,
      },
    },
    server: {
      port: config.port,
      host: config.host,
      fs: {
        // Allow serving files from the entire monorepo and cache dir
        allow: [monorepoRoot, cacheDir],
        strict: false,
      },
      watch: {
        // Watch the user's project directory for changes
        ignored: ['!**/node_modules/**', `${root}/**/*`],
      },
    },
    optimizeDeps: {
      // Force Vite to include user's preview files
      entries: [`${root}/${config.previews}`],
      // The generated config lives under node_modules/.cache, so Vite would
      // pre-bundle it as a dependency and then serve that stale copy after we
      // regenerate it. Excluding it keeps the freshly written file authoritative.
      exclude: ['virtual:react-foundry-config'],
    },
    build: {
      outDir: resolve(root, 'dist'),
    },
    publicDir: resolve(cliAppDir, 'public'),
    ...userViteConfig,
  }
}
