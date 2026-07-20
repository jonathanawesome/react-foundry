import { defineConfig } from 'tsdown'

export default defineConfig({
  // Two chunks: the side-effect-free public API (with types) and the CLI. Keeping them
  // separate is what makes `import 'react-foundry'` run nothing. The CLI bundles
  // create-config, so its `import.meta.url` resolves to dist/cli.js -> dist/{app,client}.
  entry: {
    index: 'src/index.ts',
    cli: 'src/cli.ts',
  },
  format: 'esm',
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  // Clean `.js` / `.d.ts` (the package is type:module, so .js is already ESM) to match the
  // `exports` map and the bin dispatcher, instead of tsdown's default `.mjs`.
  outExtensions: () => ({ js: '.js', dts: '.d.ts' }),
  // Only the public entry has a stable API worth shipping types for. The TS program
  // compiles `@react-foundry/core`'s raw `.ts` sources into declarations and inlines
  // them (core ships no prebuilt `.d.ts`), so its re-exported types land in index.d.ts.
  dts: { entry: 'src/index.ts' },
  // The client build + app copy already populated dist/; don't wipe them.
  clean: false,
  // Bundle the workspace packages (core + the pure utils it uses) into the output.
  noExternal: [/^@react-foundry\//],
  // Prefix regexes so subpath imports are externalized too. `@tanstack/router-plugin/vite`
  // is the one that matters: an exact-string external misses the subpath, so rolldown
  // bundles it and drags in vite + prettier's entire parser set (~7 MB).
  external: [
    /^vite(\/|$)/,
    /^@vitejs\/plugin-react(\/|$)/,
    /^@tanstack\/react-router(\/|$)/,
    /^@tanstack\/router-plugin(\/|$)/,
    /^@vanilla-extract\/vite-plugin(\/|$)/,
    /^esbuild(\/|$)/,
    /^cac(\/|$)/,
    /^glob(\/|$)/,
    /^picocolors(\/|$)/,
    // Native binary pulled in transitively (chokidar/vite); must never be bundled.
    /^fsevents(\/|$)/,
  ],
})
