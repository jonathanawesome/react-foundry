import type { FoundryConfig, NavItem } from '../types'

/**
 * Type helper for defining Foundry configuration with full TypeScript support.
 *
 * Generic, and returns exactly what it was given: a `nav` declared through
 * {@link defineNav} (or `as const`) keeps its literal labels, which is what lets
 * `NavPathsOf<typeof config>` derive the path union without the generated file.
 * Deliberately not a `const` type parameter, which would also freeze `viteConfig` into
 * readonly arrays that Vite's own types reject.
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
export function defineConfig<T extends FoundryConfig>(config: T): T {
  return config
}

/**
 * Declares a navigation tree, preserving its literal labels so `NavPathsOf` can read
 * the path union off it.
 *
 * The alternative is `as const`, which preserves the same types but checks nothing where
 * it is written: a misspelled key or a stray property surfaces later, as a confusing
 * failure somewhere else.
 *
 * @example
 * ```ts
 * // foundry.config.ts
 * import { defineConfig, defineNav, type NavPathsOf } from 'react-foundry'
 *
 * const nav = defineNav([{ label: 'Forms', children: [{ label: 'Button' }] }])
 *
 * const config = defineConfig({ nav })
 * export default config
 * export type AppNavPath = NavPathsOf<typeof config> // 'Forms' | 'Forms/Button'
 * ```
 *
 * Previews then import `AppNavPath` in place of `NavPath`, and nothing has to be
 * generated, gitignored, or exempted from a linter.
 */
export function defineNav<const T extends readonly NavItem[]>(nav: T): T {
  return nav
}
