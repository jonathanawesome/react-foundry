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
  return {
    root, // Use the user's project root instead of CLI app dir
    plugins: [
      createVirtualModulePlugin(config.previews, root, root),
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
    },
    build: {
      outDir: resolve(root, 'dist'),
    },
    publicDir: resolve(cliAppDir, 'public'),
    ...config.viteConfig,
  }
}
