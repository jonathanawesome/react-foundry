import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { InlineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import type { ResolvedFoundryConfig } from '../types'
import { createVirtualModulePlugin } from './virtual-module-plugin'

const __dirname = dirname(fileURLToPath(import.meta.url))
const cliAppDir = resolve(__dirname, '../../src/app')

export function createViteConfig(
  config: ResolvedFoundryConfig,
  root: string
): InlineConfig {
  // Find the monorepo root (go up from CLI package to root)
  const monorepoRoot = resolve(__dirname, '../../../../')

  console.log('[React Foundry] Monorepo root:', monorepoRoot)
  console.log('[React Foundry] CLI app dir:', cliAppDir)
  console.log('[React Foundry] User project root:', root)

  return {
    root: cliAppDir, // Use CLI app dir as Vite root
    plugins: [
      createVirtualModulePlugin(config.previews, root, cliAppDir),
      react(),
      tanstackRouter({
        routesDirectory: resolve(cliAppDir, 'routes'),
        generatedRouteTree: resolve(cliAppDir, 'routeTree.gen.ts'),
      }),
      vanillaExtractPlugin(),
      ...(config.viteConfig?.plugins || []),
    ],
    server: {
      port: config.port,
      host: config.host,
      fs: {
        // Allow serving files from the entire monorepo
        allow: [monorepoRoot],
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
    },
    build: {
      outDir: resolve(root, 'dist'),
    },
    publicDir: resolve(cliAppDir, 'public'),
    ...config.viteConfig,
  }
}
