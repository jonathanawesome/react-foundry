import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import type { InlineConfig, PluginOption } from 'vite'
import { isDevSource } from '../dev-source'
import type { ResolvedFoundryConfig } from '../types'
import { createConfigHmrPlugin } from './config-hmr-plugin'
import { createProvidersVirtualModulePlugin } from './providers-virtual-module-plugin'
import { createVirtualModulePlugin, resolvePreviewsGlob } from './virtual-module-plugin'
import { writeFoundryConfig } from './write-foundry-config'
import { writeNavTypes } from './write-nav-types'

// This file's own location. Published: bundled into dist/cli.js, so `here` is dist/ and
// the app tree is dist/app, the compiled client dist/client. Monorepo: raw src/vite/, so
// the app is the sibling src/app and the client bundle is unused (ui/style resolve to
// workspace source).
const here = dirname(fileURLToPath(import.meta.url))
const packageDistRoot = here

export async function createViteConfig(
  config: ResolvedFoundryConfig,
  root: string
): Promise<InlineConfig> {
  const devSource = isDevSource()
  const cliAppDir = devSource ? resolve(here, '../app') : resolve(here, 'app')
  const clientDir = resolve(here, 'client')
  // Config + theme override sheet, written to the user's cache dir.
  const cacheDir = resolve(root, 'node_modules', '.cache', 'react-foundry')
  const { configPath, themePath } = writeFoundryConfig(
    { theme: config.theme, title: config.title, nav: config.nav },
    cacheDir
  )

  // Emit the NavPath union so preview files typecheck their `nav` against the tree.
  writeNavTypes(config.nav, root)

  const {
    plugins: userPlugins,
    resolve: userResolve,
    server: userServer,
    optimizeDeps: userOptimizeDeps,
    build: userBuild,
    ...userViteConfig
  } = config.viteConfig || {}

  const plugins: PluginOption[] = [
    createConfigHmrPlugin(root, cacheDir),
    createVirtualModulePlugin(config.previews, root),
    createProvidersVirtualModulePlugin(root),
    react(),
  ]

  if (devSource) {
    // vanilla-extract + router codegen are build-time only and dropped from the published
    // deps, so they load lazily and only in the monorepo, where the .css.ts and route
    // sources are compiled fresh. A consumer using .css.ts adds VE via viteConfig.plugins.
    const [{ vanillaExtractPlugin }, { tanstackRouter }] = await Promise.all([
      import('@vanilla-extract/vite-plugin'),
      import('@tanstack/router-plugin/vite'),
    ])
    plugins.push(
      tanstackRouter({
        routesDirectory: resolve(cliAppDir, 'routes'),
        generatedRouteTree: resolve(cliAppDir, 'routeTree.gen.ts'),
      }),
      vanillaExtractPlugin()
    )
  }

  plugins.push(...(userPlugins ?? []))

  // Array-form aliases, longest match first so `/global.css` wins over the bare
  // `@react-foundry/style`. Published: ui/style/core point at the precompiled client
  // bundle. Monorepo: omitted, so they resolve to workspace source.
  const clientAliases = devSource
    ? []
    : [
        {
          find: '@react-foundry/style/global.css',
          replacement: resolve(clientDir, 'client.css'),
        },
        { find: '@react-foundry/style', replacement: resolve(clientDir, 'client.js') },
        { find: '@react-foundry/ui', replacement: resolve(clientDir, 'client.js') },
        {
          find: '@react-foundry/core',
          replacement: resolve(clientDir, 'core-runtime.js'),
        },
      ]

  const userAlias = userResolve?.alias
  const userAliases = Array.isArray(userAlias)
    ? userAlias
    : userAlias
      ? Object.entries(userAlias).map(([find, replacement]) => ({ find, replacement }))
      : []

  return {
    root: cliAppDir,
    // Keep Vite's own cache in the user's project, not in the installed package (its
    // default is <root>/node_modules/.vite, and root is dist/app inside the package).
    cacheDir: resolve(root, 'node_modules', '.vite', 'react-foundry'),
    plugins,
    resolve: {
      ...userResolve,
      alias: [
        ...clientAliases,
        { find: 'virtual:react-foundry-config', replacement: configPath },
        { find: 'virtual:react-foundry-theme', replacement: themePath },
        ...userAliases,
      ],
    },
    server: {
      port: config.port,
      host: config.host,
      ...userServer,
      fs: devSource
        ? {
            allow: [resolve(here, '../../../../'), cacheDir],
            strict: false,
            ...userServer?.fs,
          }
        : {
            // Serve the user's previews/config, the emitted cache files, and the
            // package's own dist (app tree + client bundle). Nothing else.
            allow: [root, cacheDir, packageDistRoot],
            strict: true,
            ...userServer?.fs,
          },
      watch: {
        // Excludes the user's project from Vite's watcher; previews and config are
        // watched with fs.watch in their own plugins instead.
        ignored: [`${root}/**/*`],
        ...userServer?.watch,
      },
    },
    optimizeDeps: {
      entries: [resolvePreviewsGlob(config.previews, root)],
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
