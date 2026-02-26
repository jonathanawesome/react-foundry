import type { FoundryConfig } from '../types'

export const DEFAULT_CONFIG: Required<
  Omit<FoundryConfig, 'viteConfig' | 'theme' | 'title'>
> = {
  previews: 'src/components/**/*.preview.tsx',
  port: 5173,
  host: 'localhost',
}
