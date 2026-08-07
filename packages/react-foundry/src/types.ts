import type { ColorToken } from '@react-foundry/style'
import type { UserConfig as ViteUserConfig } from 'vite'

/**
 * The color tokens a consumer may override: the anchors, surfaces, border, and text.
 * `stateHover` and the status colors are intentionally not themeable. `satisfies`
 * keeps this a compile-time subset of the real contract tokens.
 */
export const OVERRIDABLE_COLOR_TOKENS = [
  'bg',
  'fg',
  'accent',
  'canvas',
  'panel',
  'border',
  'textMuted',
  'textBody',
  'textStrong',
] as const satisfies readonly ColorToken[]

export type OverridableColorToken = (typeof OVERRIDABLE_COLOR_TOKENS)[number]

export interface ThemeColors {
  /** Any valid CSS color: hex (#ff0000), rgb(), hsl(), oklch(), named (red), or raw OKLCH triplets (62.1% 0.289482 350.9) */
  dark?: Partial<Record<OverridableColorToken, string>>
  /** Any valid CSS color: hex (#ff0000), rgb(), hsl(), oklch(), named (red), or raw OKLCH triplets (62.1% 0.289482 350.9) */
  light?: Partial<Record<OverridableColorToken, string>>
}

/** Font-family overrides. Mode-agnostic, unlike colors. */
export interface ThemeFonts {
  sans?: string
  mono?: string
}

export interface ThemeConfig {
  colors?: ThemeColors
  fonts?: ThemeFonts
}

/**
 * One group in the navigation tree. Nests to arbitrary depth.
 *
 * Declaration order is display order, so this is also how you control where a
 * section sits in the shelf.
 */
export interface NavItem {
  label: string
  /**
   * `readonly` so a tree declared through `defineNav` or `as const` still satisfies this,
   * which is what lets `NavPathsOf` read literal labels off it. Nothing mutates a
   * declared tree.
   */
  children?: readonly NavItem[]
}

export interface FoundryConfig {
  /**
   * Glob pattern for preview files.
   * Requires server restart; changing it while one is running logs a warning.
   * @default 'src/components/**\/*.preview.tsx'
   */
  previews?: string

  /**
   * The navigation tree. Array order is display order.
   *
   * Every path declared here becomes part of the `NavPath` union that preview
   * files check their `nav` export against, so typos are compile errors rather
   * than previews quietly landing in the wrong place.
   *
   * Optional: with no tree declared, `NavPath` stays `string` and the shelf is
   * inferred from the `nav` values it finds, alphabetically.
   * Hot-reloadable: both the shelf and the generated `NavPath` union update on
   * save, though your editor may need a moment to reload the types.
   * @default []
   */
  nav?: readonly NavItem[]

  /**
   * Port for dev server.
   * Requires server restart; changing it while one is running logs a warning.
   * @default 5173
   */
  port?: number

  /**
   * Host for dev server.
   * Requires server restart; changing it while one is running logs a warning.
   * @default 'localhost'
   */
  host?: string

  /** Display title for the Foundry instance. Hot-reloadable. */
  title?: string

  /** Theme customization. Hot-reloadable. */
  theme?: ThemeConfig

  /**
   * Whether to emit `foundry-nav.gen.d.ts` at all, which is what narrows the ambient
   * `NavPath` to your declared tree.
   *
   * Set false when you derive the union from the config instead, with `defineNav` and
   * `NavPathsOf`. That route needs no generated file, so nothing has to be gitignored,
   * exempted from a linter, or emitted before `tsc` runs; the tradeoff is a
   * project-local type your previews import by name rather than an ambient one.
   * Turning this off deletes any file a previous run left behind, so a stale union
   * cannot outlive the setting.
   *
   * Nothing is emitted when `nav` is empty either way.
   * Hot-reloadable: turning it off mid-session removes the file on the next save.
   * @default true
   */
  navTypes?: boolean

  /**
   * Where to write the generated `foundry-nav.gen.d.ts` (the `NavPath` union),
   * as an exact file path resolved against the config root.
   *
   * By default the file lands next to your previews (inferred from the `previews`
   * glob base), which is what makes typed `NavPath` work when previews live in a
   * different package than the config. Set this only when that inference can't
   * reach the right place. Must be gitignored.
   * Hot-reloadable.
   */
  navTypesPath?: string

  /**
   * Custom Vite config overrides.
   * Requires server restart.
   */
  viteConfig?: ViteUserConfig
}

export interface ResolvedFoundryConfig
  extends Required<
    Omit<FoundryConfig, 'viteConfig' | 'theme' | 'title' | 'navTypesPath'>
  > {
  viteConfig: ViteUserConfig
  theme?: ThemeConfig
  title?: string
  navTypesPath?: string
}
