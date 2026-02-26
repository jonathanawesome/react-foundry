import type { ComponentPreview } from './types'

export function createPreview<_TProps = Record<string, unknown>>(
  config: ComponentPreview
): ComponentPreview {
  return config
}
