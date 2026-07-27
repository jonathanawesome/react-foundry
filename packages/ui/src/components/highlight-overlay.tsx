import { useLayoutEffect, useRef } from 'react'

import { highlightOverlayStyles } from './highlight-overlay.css'

interface HighlightOverlayProps {
  /** The element to outline, or null to render nothing. */
  target: HTMLElement | null
  /** Solid outline for a committed pin, faint for a hover preview. */
  pinned?: boolean
}

/**
 * Outlines an element in the preview canvas.
 *
 * Must render outside `AccessibilityChecker`: that panel sets a `transform` for its slide
 * animation, which makes it the containing block for any `position: fixed` descendant, so
 * an overlay nested inside it would position against the panel instead of the viewport.
 */
export function HighlightOverlay({ target, pinned = false }: HighlightOverlayProps) {
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
    }

    measure()

    // Capture, because the preview pane scrolls its own overflow and that does not bubble.
    window.addEventListener('scroll', measure, { capture: true, passive: true })
    window.addEventListener('resize', measure)

    // For previews that resize themselves in response to their own controls.
    const observer = new ResizeObserver(measure)
    observer.observe(target)

    return () => {
      window.removeEventListener('scroll', measure, { capture: true })
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [target])

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
