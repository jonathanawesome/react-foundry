declare module 'virtual:react-foundry-previews' {
  import type { PreviewFile } from './types'
  const previewModules: Record<string, PreviewFile>
  export default previewModules
}
