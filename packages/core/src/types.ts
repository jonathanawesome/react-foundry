import type { ComponentType, ReactElement } from 'react'

// biome-ignore lint/suspicious/noExplicitAny: component refs need flexible typing
type AnyComponent = ComponentType<any>

export interface ComponentVariant {
  name: string
  props: Record<string, unknown>
}

export interface ComponentDemo {
  name: string
  render: () => ReactElement
}

export interface ComponentPreview {
  title: string
  component: AnyComponent
  variants?: ComponentVariant[]
  demos?: ComponentDemo[]
  category?: string
}

export interface PreviewModule {
  default: ComponentPreview
}

export interface DiscoveredComponent {
  id: string
  path: string
  title: string
  component: AnyComponent
  category: string
  variants?: ComponentVariant[]
  demos?: ComponentDemo[]
  name: string
}
