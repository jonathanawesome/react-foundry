import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // ThemeProvider imports the theme `.css.ts` files, whose `style()` needs the
  // file scope this transform injects.
  plugins: [vanillaExtractPlugin()],
  test: {
    // jsdom for the component tests; the pure utils tests run fine under it too.
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
})
