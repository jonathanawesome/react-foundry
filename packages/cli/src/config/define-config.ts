import type { FoundryConfig } from '../types'

/**
 * Type helper for defining Foundry configuration with full TypeScript support.
 *
 * @example
 * ```ts
 * import { defineConfig } from '@react-foundry/cli'
 *
 * export default defineConfig({
 *   previews: 'src/components/**\/*.preview.tsx',
 *   port: 5173,
 *   debug: true,
 * })
 * ```
 */
export function defineConfig(config: FoundryConfig): FoundryConfig {
  return config
}
