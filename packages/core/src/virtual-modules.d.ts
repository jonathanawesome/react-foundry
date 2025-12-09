declare module 'virtual:react-foundry-previews' {
  import type { PreviewModule } from './types'
  const previewModules: Record<string, PreviewModule>
  export default previewModules
}
