import type { ColorToken } from '@react-foundry/style'
import type { UserConfig as ViteUserConfig } from 'vite'

export interface ThemeColors {
  /** Any valid CSS color: hex (#ff0000), rgb(), hsl(), oklch(), named (red), or raw OKLCH triplets (62.1% 0.289482 350.9) */
  dark?: Partial<Record<ColorToken, string>>
  /** Any valid CSS color: hex (#ff0000), rgb(), hsl(), oklch(), named (red), or raw OKLCH triplets (62.1% 0.289482 350.9) */
  light?: Partial<Record<ColorToken, string>>
}

export interface ThemeConfig {
  colors?: ThemeColors
}

/**
 * One group in the navigation tree. Nests to arbitrary depth.
 *
 * Declaration order is display order, so this is also how you control where a
 * section sits in the shelf.
 */
export interface NavItem {
  label: string
  children?: NavItem[]
}

export interface FoundryConfig {
  /**
   * Glob pattern for preview files.
   * Requires server restart.
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
   * Requires server restart.
   * @default []
   */
  nav?: NavItem[]

  /**
   * Port for dev server.
   * Requires server restart.
   * @default 5173
   */
  port?: number

  /**
   * Host for dev server.
   * Requires server restart.
   * @default 'localhost'
   */
  host?: string

  /** Display title for the Foundry instance. Hot-reloadable. */
  title?: string

  /** Theme customization. Hot-reloadable. */
  theme?: ThemeConfig

  /**
   * Custom Vite config overrides.
   * Requires server restart.
   */
  viteConfig?: ViteUserConfig
}

export interface ResolvedFoundryConfig
  extends Required<Omit<FoundryConfig, 'viteConfig' | 'theme' | 'title'>> {
  viteConfig: ViteUserConfig
  theme?: ThemeConfig
  title?: string
}
