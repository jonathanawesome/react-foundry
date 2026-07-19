import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    // The nav path union is a type-level guarantee, so asserting on it needs a
    // real typecheck pass rather than a runtime one.
    typecheck: {
      enabled: true,
      include: ['tests/**/*.test-d.ts'],
    },
  },
})
