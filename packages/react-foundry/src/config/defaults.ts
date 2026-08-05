import type { FoundryConfig } from '../types'

export const DEFAULT_CONFIG: Required<
  Omit<FoundryConfig, 'viteConfig' | 'theme' | 'title' | 'navTypesPath'>
> = {
  previews: 'src/components/**/*.preview.tsx',
  nav: [],
  navTypes: true,
  port: 5173,
  host: 'localhost',
}
