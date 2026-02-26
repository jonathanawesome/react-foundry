import type { ComponentPreview } from '@react-foundry/core'

import { discoverComponents } from './discovery'

export function getComponentById(id: string): ComponentPreview | null {
  const components = discoverComponents()
  const component = components.find((c) => c.id === id)
  return component || null
}
