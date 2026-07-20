import type { FoundryConfig } from '../types'

/**
 * Type helper for defining Foundry configuration with full TypeScript support.
 *
 * @example
 * ```ts
 * import { defineConfig } from 'react-foundry'
 *
 * export default defineConfig({
 *   previews: 'src/components/**\/*.preview.tsx',
 *   title: 'My Components',
 *   nav: [{ label: 'Forms', children: [{ label: 'Button' }] }],
 * })
 * ```
 */
export function defineConfig(config: FoundryConfig): FoundryConfig {
  return config
}
