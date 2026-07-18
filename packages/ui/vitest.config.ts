import { resolve } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // vanilla-extract's `style()` needs a file scope injected by its transform, so the
  // plugin has to run here too, otherwise importing any `.css.ts` throws.
  plugins: [vanillaExtractPlugin()],
  resolve: {
    alias: {
      'virtual:react-foundry-config': resolve(
        __dirname,
        'tests/fixtures/foundry-config.ts'
      ),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
