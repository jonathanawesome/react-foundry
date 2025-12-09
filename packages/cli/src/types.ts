import type { UserConfig as ViteUserConfig } from 'vite'

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

  /**
   * Custom Vite config overrides
   */
  viteConfig?: ViteUserConfig
}

export interface ResolvedFoundryConfig extends Required<FoundryConfig> {}
