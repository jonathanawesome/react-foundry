import { resolve } from 'node:path'
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin'
import { defineConfig } from 'vitest/config'

const fixture = (name: string) => resolve(import.meta.dirname, 'tests/fixtures', name)

export default defineConfig({
  // The app tree pulls in the ui and style packages, whose `.css.ts` files need a file
  // scope injected by vanilla-extract's transform or `style()` throws on import.
  plugins: [vanillaExtractPlugin()],
  resolve: {
    // The three modules the CLI's plugins emit at dev time. Stubbed with fixtures so the
    // route tree can be imported and exercised without a running dev server.
    alias: [
      { find: 'virtual:react-foundry-config', replacement: fixture('virtual-config.ts') },
      {
        find: 'virtual:react-foundry-previews',
        replacement: fixture('virtual-previews.ts'),
      },
      {
        find: 'virtual:react-foundry-providers',
        replacement: fixture('virtual-providers.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
  },
})
