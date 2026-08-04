import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Runs INSIDE the monorepo, where the vanilla-extract plugin can compile the `.css.ts`
// files. Produces the client bundle the published app tree aliases to: one JS per entry
// plus a single `client.css` (global + fonts + themes + the ui component styles) and the
// hashed woff2. react / react-dom / axe stay external so the consumer's build resolves a
// single instance of each. The router is deliberately NOT external: leaving it bare here
// would put a `@tanstack/react-router` import in a file the consumer's Vite resolves,
// which is what makes the router theirs to satisfy rather than our implementation detail.
export default defineConfig({
  plugins: [vanillaExtractPlugin(), react()],
  build: {
    lib: {
      entry: {
        client: 'src/client.ts',
        'core-runtime': 'src/core.ts',
      },
      formats: ['es'],
      // Stable name so the shipped app tree can alias `@react-foundry/style/global.css`
      // to it. The font is base64-inlined into this file (Vite lib behavior), so the CSS
      // is self-contained and there is no separate asset to co-locate.
      cssFileName: 'client',
    },
    cssCodeSplit: false,
    outDir: 'dist/client',
    emptyOutDir: true,
    assetsDir: 'assets',
    rollupOptions: {
      external: [/^react(\/|$)/, /^react-dom(\/|$)/, 'axe-core'],
      output: {
        // The single stylesheet lands at dist/client/client.css (un-hashed) so the app
        // alias can target it; the font is inlined, so it's the only asset.
        assetFileNames: (asset) => {
          const name = asset.names?.[0] ?? asset.name ?? ''
          return name.endsWith('.css') ? 'client.css' : 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
})
