declare module 'virtual:react-foundry-previews' {
  import type { PreviewModule } from '@react-foundry/core'

  const previewModules: Record<string, PreviewModule>
  export default previewModules
}

declare module 'virtual:react-foundry-config' {
  import type { ColorToken } from '@react-foundry/style'
  export const themeColors: {
    dark: Partial<Record<ColorToken, string>>
    light: Partial<Record<ColorToken, string>>
  }
  export const foundryTitle: string
}
