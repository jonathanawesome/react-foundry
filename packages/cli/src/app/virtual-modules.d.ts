declare module 'virtual:react-foundry-previews' {
  import type { PreviewFile } from '@react-foundry/core'

  const previewModules: Record<string, PreviewFile>
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
