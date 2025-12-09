declare module 'virtual:react-foundry-previews' {
  import type { PreviewModule } from '@react-foundry/core'

  const previewModules: Record<string, PreviewModule>
  export default previewModules
}
