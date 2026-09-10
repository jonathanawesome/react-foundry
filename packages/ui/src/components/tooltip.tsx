import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { tooltipStyles } from './tooltip.css'

/** Space between the control and its bubble. */
const GAP = 8

/** How close to the window's edge the bubble may sit before it is pulled back. */
const VIEWPORT_MARGIN = 8

/** Where the bubble sits, in pixels relative to the wrapper's top-left corner. */
interface Placement {
  left: number
  top: number
}

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
 * Placement is measured rather than declared, so the bubble stays on screen
 * wherever its control ends up: centered under the control by default, pulled
 * back when that would cross a side of the window, flipped above when there is
 * no room below. That is the whole of what a tooltip needs, which is why this
 * measures directly instead of pulling in a positioning library.
 *
 * The bubble is decoration, not the accessible name. The control it wraps
 * already carries one, and announcing the same words a second time is worse
 * than silence, so the bubble is hidden from assistive tech.
 */
export function Tooltip({ label, shortcut, children }: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [placement, setPlacement] = useState<Placement | null>(null)
  const wrapperRef = useRef<HTMLSpanElement>(null)
  const bubbleRef = useRef<HTMLSpanElement>(null)

  const place = useCallback(() => {
    const wrapper = wrapperRef.current
    const bubble = bubbleRef.current
    if (!wrapper || !bubble) return

    const anchor = wrapper.getBoundingClientRect()

    // offsetWidth/offsetHeight rather than a rect: they report the untransformed
    // layout box, so they read the same whatever placement is already applied.
    // Measuring the bubble's own rect would feed the last answer back into the
    // next one and walk the bubble across the screen.
    const { offsetWidth: width, offsetHeight: height } = bubble

    const centeredLeft = anchor.left + anchor.width / 2 - width / 2
    const rightmost = window.innerWidth - VIEWPORT_MARGIN - width

    // A bubble wider than the window has no good answer; pin it to the left edge
    // rather than letting the clamp invert and push it off the other side.
    const clampedLeft =
      rightmost <= VIEWPORT_MARGIN
        ? VIEWPORT_MARGIN
        : Math.min(Math.max(centeredLeft, VIEWPORT_MARGIN), rightmost)

    const fitsBelow = anchor.bottom + GAP + height <= window.innerHeight - VIEWPORT_MARGIN

    setPlacement({
      // Back into the wrapper's coordinates: it is the containing block, and its
      // border box starts exactly at the anchor rect's corner.
      left: clampedLeft - anchor.left,
      top: fitsBelow ? anchor.height + GAP : -(height + GAP),
    })
  }, [])

  // Before paint, so the bubble is never seen at an unmeasured position. The
  // label is a dependency because it changes under a toggle, e.g. "Enable" to
  // "Disable", which resizes the bubble out from under the last measurement.
  useLayoutEffect(() => {
    if (!isOpen) {
      setPlacement(null)
      return
    }

    place()
  }, [isOpen, label, shortcut, place])

  useEffect(() => {
    if (!isOpen) return

    window.addEventListener('resize', place)
    return () => window.removeEventListener('resize', place)
  }, [isOpen, place])

  return (
    // Focus and blur rather than focusin/focusout by name: React's synthetic
    // versions of these already bubble up from the control.
    //
    // The wrapper is not the interactive thing, it only observes the control it
    // wraps; giving it a role would put a second, empty control in the tree.
    // biome-ignore lint/a11y/noStaticElementInteractions: it observes, it does not act
    <span
      ref={wrapperRef}
      className={tooltipStyles.wrapper}
      onPointerEnter={() => setIsOpen(true)}
      onPointerLeave={() => setIsOpen(false)}
      onFocus={() => setIsOpen(true)}
      onBlur={() => setIsOpen(false)}
    >
      {children}

      {isOpen && (
        <span
          ref={bubbleRef}
          className={tooltipStyles.bubble}
          style={{
            left: placement?.left,
            top: placement?.top,
            // One frame at the wrong spot would be a visible jump. useLayoutEffect
            // should land the measurement before paint; this is the belt to that
            // suspenders, and covers a ref that never resolved.
            visibility: placement ? undefined : 'hidden',
          }}
          aria-hidden
        >
          <span className={tooltipStyles.label}>{label}</span>
          {shortcut && <kbd className={tooltipStyles.shortcut}>{shortcut}</kbd>}
        </span>
      )}
    </span>
  )
}
