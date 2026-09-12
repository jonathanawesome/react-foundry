import type { ReactNode } from 'react'

import { scrollable } from './scrollable.css'

export interface ScrollableProps {
  children?: ReactNode
  /** Composes after the base style: the caller's layout, size, and spacing. */
  className?: string
  /** Makes the region and everything in it inert, as when its panel is collapsed. */
  inert?: boolean
}

/**
 * A scroll container whose scrollbar foundry styles.
 *
 * Foundry uses this for any chrome region that can scroll (the shelf, the props
 * panel, the accessibility checker) rather than styling `::-webkit-scrollbar`
 * globally. Scoping the scrollbar to this component's class keeps it off the
 * canvas, where the consumer's component must render with its own scrollbars.
 *
 * A passed `className` composes after the base, so a caller can add layout
 * (flex, padding, a fixed height) without re-declaring the scroll behaviour.
 * That is the whole surface: nothing else passes through to the `<div>`.
 */
export function Scrollable({ children, className, inert }: ScrollableProps) {
  return (
    <div className={className ? `${scrollable} ${className}` : scrollable} inert={inert}>
      {children}
    </div>
  )
}
