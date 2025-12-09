import type { ComponentPreview } from './types'

export function createPreview<TProps = Record<string, unknown>>(
  config: ComponentPreview
): ComponentPreview {
  return config
}
