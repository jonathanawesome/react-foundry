import { type ReactNode, useState } from 'react'

import { tooltipStyles } from './tooltip.css'

export interface TooltipProps {
  /** What the control does, e.g. `Toggle Theme`. */
  label: string
  /** Keyboard shortcut for the control, rendered as a key cap after the label. */
  shortcut?: string
  /** The control being described. Exactly one. */
  children: ReactNode
}

/**
 * A themed hover and focus tooltip for a single control.
 *
 * Positioned by plain CSS against a wrapper rather than by a measure-and-flip
 * pass: foundry's tooltips only ever hang under the toolbar, which is fixed in
 * the top-left corner with nothing to collide with. A control inside a
 * scrolling panel would need real positioning, and should not use this yet.
 *
 * The bubble is decoration, not the accessible name. The control it wraps
 * already carries one, and announcing the same words a second time is worse
 * than silence, so the bubble is hidden from assistive tech.
 */
export function Tooltip({ label, shortcut, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    // Focus and blur rather than focusin/focusout by name: React's synthetic
    // versions of these already bubble up from the control.
    //
    // The wrapper is not the interactive thing, it only observes the control it
    // wraps; giving it a role would put a second, empty control in the tree.
    // biome-ignore lint/a11y/noStaticElementInteractions: it observes, it does not act
    <span
      className={tooltipStyles.wrapper}
      onPointerEnter={() => setIsOpen(true)}
      onPointerLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}

      {isOpen && (
        <span className={tooltipStyles.bubble} aria-hidden>
          <span className={tooltipStyles.label}>{label}</span>
          {shortcut && <kbd className={tooltipStyles.shortcut}>{shortcut}</kbd>}
        </span>
      )}
    </span>
  )
}
