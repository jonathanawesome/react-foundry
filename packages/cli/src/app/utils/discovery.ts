import previewModules from 'virtual:react-foundry-previews'
import { createDiscovery } from '@react-foundry/core'

console.log('[React Foundry] Preview modules from virtual import:', previewModules)
console.log(
  '[React Foundry] Number of preview modules:',
  Object.keys(previewModules).length
)

export const discoverComponents = createDiscovery(previewModules)
