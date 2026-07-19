import { foundryNav } from 'virtual:react-foundry-config'
import previewModules from 'virtual:react-foundry-previews'
import { createDiscovery } from '@react-foundry/core'

export const discoverNav = createDiscovery(previewModules, foundryNav)
