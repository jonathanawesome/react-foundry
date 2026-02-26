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

export interface FoundryConfig {
  /**
   * Glob pattern for preview files
   * @default 'src/components/**\/*.preview.tsx'
   */
  previews?: string

  /**
   * Port for dev server
   * @default 5173
   */
  port?: number

  /**
   * Host for dev server
   * @default 'localhost'
   */
  host?: string

  /** Display title for the Foundry instance */
  title?: string

  /** Theme customization */
  theme?: ThemeConfig

  /**
   * Custom Vite config overrides
   */
  viteConfig?: ViteUserConfig
}

export interface ResolvedFoundryConfig
  extends Required<Omit<FoundryConfig, 'viteConfig' | 'theme' | 'title'>> {
  viteConfig: ViteUserConfig
  theme?: ThemeConfig
  title?: string
}
