declare module 'virtual:react-foundry-config' {
  import type { ColorToken } from './theme-contract.css'
  export const themeColors: {
    dark: Partial<Record<ColorToken, string>>
    light: Partial<Record<ColorToken, string>>
  }
}
