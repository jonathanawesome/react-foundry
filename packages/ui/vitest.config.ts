import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // vanilla-extract's `style()` needs a file scope injected by its transform, so the
  // plugin has to run here too, otherwise importing any `.css.ts` throws.
  plugins: [vanillaExtractPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
