declare module 'virtual:react-foundry-previews' {
  import type { PreviewFile } from '@react-foundry/core'

  const previewModules: Record<string, PreviewFile>
  export default previewModules
}

declare module 'virtual:react-foundry-config' {
  import type { NavItem } from '@react-foundry/core'
  export const foundryTitle: string
  export const foundryNav: NavItem[]
}

declare module 'virtual:react-foundry-providers' {
  import type { FoundryProvider } from '@react-foundry/core'
  export const Provider: FoundryProvider
}

declare module 'virtual:react-foundry-theme' {}
