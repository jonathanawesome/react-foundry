import { useLayoutEffect, useRef } from 'react'

import { highlightOverlayStyles } from './highlight-overlay.css'

interface HighlightOverlayProps {
  /** The element to outline, or null to render nothing. */
  target: HTMLElement | null
  /** Solid outline for a committed pin, faint for a hover preview. */
  pinned?: boolean
  /** Canvas the outline is confined to, so it cannot spill onto foundry's chrome. */
  clipTo?: React.RefObject<HTMLElement | null>
}

/**
 * Outlines an element in the preview canvas.
 *
 * Renders outside `AccessibilityChecker` because it belongs to the canvas, not the panel:
 * the panel collapses to zero height with `overflow: hidden` and goes `inert`, all of
 * which an outline living inside it would inherit.
 */
export function HighlightOverlay({
  target,
  pinned = false,
  clipTo,
}: HighlightOverlayProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!target || !el) return

    // Written straight to the node rather than through state. Scroll fires per frame, and
    // a React render per frame is wasted work for four numbers nothing else reads.
    const measure = () => {
      const { left, top, width, height } = target.getBoundingClientRect()
      el.style.transform = `translate(${left}px, ${top}px)`
      el.style.width = `${width}px`
      el.style.height = `${height}px`

      // Confine the outline to the canvas. Without this it keeps drawing at the element's
      // position after it scrolls out, and at zIndex 999 it lands on top of the shelf and
      // props panel, which sit at 9. Insets are measured from this element's own edges, so
      // a target fully inside the pane yields inset(0) and one fully outside clips away.
      const pane = clipTo?.current?.getBoundingClientRect()
      el.style.clipPath = pane
        ? `inset(${Math.max(0, pane.top - top)}px ${Math.max(0, left + width - pane.right)}px ${Math.max(0, top + height - pane.bottom)}px ${Math.max(0, pane.left - left)}px)`
        : 'none'
    }

    measure()

    // Capture, because the preview pane scrolls its own overflow and that does not bubble.
    window.addEventListener('scroll', measure, { capture: true, passive: true })
    window.addEventListener('resize', measure)

    // The target, for previews that resize themselves via their own controls. The pane
    // too, because toggling the checker panel resizes the canvas and moves the target
    // without firing either scroll or resize.
    const observer = new ResizeObserver(measure)
    observer.observe(target)
    const pane = clipTo?.current
    if (pane) observer.observe(pane)

    return () => {
      window.removeEventListener('scroll', measure, { capture: true })
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [target, clipTo])

  if (!target) return null

  return (
    <div
      ref={ref}
      className={highlightOverlayStyles}
      data-foundry-highlight
      data-pinned={pinned}
      aria-hidden
    />
  )
}
