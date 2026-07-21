import type { HTMLAttributes } from 'react'

import { scrollable } from './scrollable.css'

export type ScrollableProps = HTMLAttributes<HTMLDivElement>

/**
 * A scroll container whose scrollbar foundry styles.
 *
 * Foundry uses this for any chrome region that can scroll (the shelf, the props
 * panel, the accessibility checker) rather than styling `::-webkit-scrollbar`
 * globally. Scoping the scrollbar to this component's class keeps it off the
 * canvas, where the consumer's component must render with its own scrollbars.
 *
 * A passed `className` composes after the base, so a caller can add layout
 * (flex, padding) without re-declaring the scroll behaviour.
 */
export function Scrollable({ className, ...rest }: ScrollableProps) {
  return (
    <div className={className ? `${scrollable} ${className}` : scrollable} {...rest} />
  )
}
