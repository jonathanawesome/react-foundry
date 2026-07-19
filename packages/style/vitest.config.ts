import { resolve } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // ThemeProvider imports the theme `.css.ts` files, whose `style()` needs the
  // file scope this transform injects.
  plugins: [vanillaExtractPlugin()],
  resolve: {
    alias: {
      // themes.css.ts reads its colours from this module, which the CLI only
      // aliases at runtime.
      'virtual:react-foundry-config': resolve(
        __dirname,
        'tests/fixtures/foundry-config.ts'
      ),
    },
  },
  test: {
    // jsdom for the component tests; the pure utils tests run fine under it too.
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
