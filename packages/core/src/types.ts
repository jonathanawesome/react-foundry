import type { ComponentType, ReactElement } from 'react'

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
  component: ComponentType<Record<string, unknown>>
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
  component: ComponentType<Record<string, unknown>>
  category: string
  variants?: ComponentVariant[]
  demos?: ComponentDemo[]
  name: string
}
