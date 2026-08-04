import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { type InlineConfig, type PluginOption, searchForWorkspaceRoot } from 'vite'
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

// Foundry's own app-shell runtime. The dev server must pre-bundle and dedupe these so a
// consumer whose previews live in a separate workspace package (isolated pnpm node_modules)
// ends up with a single instance of each, shared between foundry's shell and the previews.
// Without it, in a non-hoisted layout: `react-dom/client` and the use-sync-external-store
// shim are CJS whose named ESM exports (`createRoot`, `useSyncExternalStoreWithSelector`)
// resolve to nothing unless pre-bundled, and `@tanstack/react-router` gets a second copy in
// the optimized preview chunk, giving the router two React contexts. All are resolvable from
// foundry's own tree — react/react-dom via the peer, react-store and the shim via direct
// deps — so dedupe/include work regardless of how the consumer hoists.
const FOUNDRY_DEDUPE = [
  'react',
  'react-dom',
  '@tanstack/react-router',
  '@tanstack/react-store',
]

const FOUNDRY_OPTIMIZE_INCLUDE = [
  'react',
  'react-dom',
  'react-dom/client',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
  '@tanstack/react-router',
  '@tanstack/react-store',
  'use-sync-external-store/shim/with-selector',
]

/** `optimizeDeps.entries` may be a string or an array; normalize to an array so it can merge. */
function toEntryArray(entries: string | readonly string[] | undefined): string[] {
  if (!entries) return []
  return Array.isArray(entries) ? [...entries] : [entries as string]
}

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
  // Pass the previews glob so the file lands next to previews that live in another
  // package, and any explicit override.
  writeNavTypes(config.nav, root, {
    previews: config.previews,
    navTypesPath: config.navTypesPath,
  })

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
    // vanilla-extract is build-time only and dropped from the published deps, so it loads
    // lazily and only in the monorepo, where the .css.ts sources are compiled fresh. A
    // consumer using .css.ts adds VE via viteConfig.plugins.
    const { vanillaExtractPlugin } = await import('@vanilla-extract/vite-plugin')
    plugins.push(vanillaExtractPlugin())
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
      // Force a single instance of foundry's shared runtime, then the consumer's own
      // dedupe on top. Prevents the previews (resolved from a sibling package) and
      // foundry's shell from each getting their own router/react copy.
      dedupe: [...FOUNDRY_DEDUPE, ...(userResolve?.dedupe ?? [])],
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
            // Serve the user's previews/config, the emitted cache files, the
            // package's own dist (app tree + client bundle), and the monorepo
            // workspace root so symlinked workspace previews/providers resolve
            // without hand-adding it. searchForWorkspaceRoot is Vite's own
            // lockfile/.git walk and returns `root` unchanged outside a workspace.
            allow: [root, cacheDir, packageDistRoot, searchForWorkspaceRoot(root)],
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
      ...userOptimizeDeps,
      // Scan foundry's own app shell (index.html -> main.tsx -> routes) alongside the
      // consumer's previews. Vite's dep scanner only follows the entries it is given, so
      // without the app entry foundry's own runtime deps are never discovered or deduped.
      entries: [
        resolve(cliAppDir, 'index.html'),
        resolvePreviewsGlob(config.previews, root),
        ...toEntryArray(userOptimizeDeps?.entries),
      ],
      include: [...FOUNDRY_OPTIMIZE_INCLUDE, ...(userOptimizeDeps?.include ?? [])],
      exclude: [
        'virtual:react-foundry-config',
        'virtual:react-foundry-theme',
        ...(userOptimizeDeps?.exclude ?? []),
      ],
    },
    build: {
      outDir: resolve(root, 'dist'),
      ...userBuild,
    },
    publicDir: resolve(cliAppDir, 'public'),
    ...userViteConfig,
  }
}
