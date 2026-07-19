import previewModules from 'virtual:react-foundry-previews'
import { createDiscovery, type PreviewModule } from '@react-foundry/core'

// Temporary shim: the virtual module now emits { module, exportOrder } per file,
// but discovery still reads the old default-export shape. Removed in the commit
// that rewrites discovery to build the nav tree.
const legacyModules = Object.fromEntries(
  Object.entries(previewModules).map(([path, file]) => [
    path,
    file.module as unknown as PreviewModule,
  ])
)

export const discoverComponents = createDiscovery(legacyModules)
