import type { DiscoveredComponent } from '@react-foundry/core'

import { discoverComponents } from './discovery'

export function getComponentById(id: string): DiscoveredComponent | null {
  const components = discoverComponents()
  const component = components.find((c) => c.id === id)
  return component || null
}
