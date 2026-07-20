import { foundryNav } from 'virtual:react-foundry-config'
import previewModules from 'virtual:react-foundry-previews'
import { createDiscovery } from '@react-foundry/core'

// Constructed once at module scope so the memoized tree is shared: both the root
// route (shelf) and the splat route (URL resolution) import this same binding.
// Calling createDiscovery per route would build the tree twice per navigation.
export const discoverNav = createDiscovery(previewModules, foundryNav)
