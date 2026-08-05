import {
  coerceControlValues,
  type FoundryProvider,
  type Preview as PreviewComponent,
} from '@react-foundry/core'
import { chromeSurface, ThemeContext } from '@react-foundry/style'
import { useSearch } from '@tanstack/react-router'
import {
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useRef,
  useState,
} from 'react'

import { useUIStore } from '../state'

import { AccessibilityChecker } from './accessibility-checker'
import { HighlightOverlay } from './highlight-overlay'
import { previewStyles } from './preview.css'

/** Used when the consumer has no `foundry.providers.tsx`: render the preview as-is. */
const PassthroughProvider: FoundryProvider = ({ children }) => children

/**
 * Centers an element vertically within the preview pane.
 *
 * Scrolls the pane directly rather than calling `scrollIntoView`, which walks every
 * scrollable ancestor and obeys the document's `scroll-behavior`, and so does not
 * reliably move this particular scrollport. The panel below the pane needs no correction:
 * it is a flow row, so the pane's scrollport already ends where the panel begins.
 */
function centerInPane(target: HTMLElement, pane: HTMLElement) {
  const paneBox = pane.getBoundingClientRect()
  const targetBox = target.getBoundingClientRect()
  const offset = targetBox.top + targetBox.height / 2 - (paneBox.top + paneBox.height / 2)

  pane.scrollTo({ top: pane.scrollTop + offset, behavior: 'smooth' })
}

/**
 * Stands in for the canvas ref on a surface with no preview, so the accessibility
 * checker keeps its existing "nothing to scan" behaviour. Handing it the empty canvas
 * instead would let axe's page-level rules report on foundry's own chrome.
 */
const NO_CANVAS_REF: RefObject<HTMLDivElement | null> = { current: null }

interface PreviewProps {
  preview: PreviewComponent | null
  /** Shown when nothing is selected and no `fallback` is given. */
  emptyMessage?: string
  /**
   * Foundry chrome to show in place of the canvas when there is no preview, such as the
   * group landing under `/$`. Rendered outside the consumer's Provider on purpose: it is
   * foundry's own UI, and putting it inside consumer context is exactly the inversion the
   * canvas boundary exists to prevent.
   */
  fallback?: ReactNode
  /** The consumer's global provider, mounted on every surface. */
  Provider?: FoundryProvider
}

export function Preview({
  preview,
  emptyMessage = 'Select a preview from the sidebar',
  fallback,
  Provider = PassthroughProvider,
}: PreviewProps) {
  const previewPaneRef = useRef<HTMLDivElement>(null)

  // Highlight state lives here rather than in AccessibilityChecker, because the overlay
  // has to render outside that panel. See HighlightOverlay for why.
  const [pinnedTarget, setPinnedTarget] = useState<HTMLElement | null>(null)
  const [hoveredTarget, setHoveredTarget] = useState<HTMLElement | null>(null)

  const handlePin = useCallback((target: HTMLElement | null) => {
    setPinnedTarget(target)
    if (target && previewPaneRef.current) centerInPane(target, previewPaneRef.current)
  }, [])

  const isAccessibilityEnabled = useUIStore.use.isAccessibilityEnabled()

  // Read foundry's resolved mode straight off the context, not via useTheme(), which
  // throws with no provider. Passed to the consumer's Provider so their design system
  // can track foundry's light/dark toggle. Defaults to light outside a ThemeProvider.
  const theme = useContext(ThemeContext)?.resolvedTheme ?? 'light'

  // Control values ride in the URL. Coerce them against the preview's own schema
  // so a hand-edited or shared link resolves to typed values.
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const controlValues = preview?.controls
    ? coerceControlValues(preview.controls, search)
    : undefined

  // Capitalised so JSX treats it as a component. Rendering it as an element
  // rather than calling it gives the preview its own fiber, which is what makes
  // hooks inside a preview legal.
  const Component = preview

  return (
    <div className={previewStyles.previewContainer}>
      {/*
        The canvas mounts on every surface, preview or not, so the consumer's Provider is
        always mounted. Design systems routinely do document-level work on mount (a theme
        class on <html>, `dir`, font loading, portal roots), and none of it ran until a
        preview was selected: a cold load on `/` rendered under the wrong palette, and any
        group node dropped back to it.

        data-foundry-canvas marks the reset boundary: foundry's appearance resets
        (global-styles.css.ts) deliberately do not reach the consumer's component. The
        Provider wraps inside it, so app context and the consumer's canvas-scoped CSS
        reach the preview the same way in every state, with foundry's chrome resets
        touching neither.
      */}
      <div
        className={previewStyles.previewPane}
        ref={previewPaneRef}
        data-foundry-canvas
        data-empty={Component === null}
      >
        <Provider theme={theme}>
          {Component ? <Component controlValues={controlValues} /> : null}
        </Provider>
      </div>

      {Component === null &&
        (fallback ?? (
          <div className={`${chromeSurface} ${previewStyles.noSelection}`}>
            {emptyMessage}
          </div>
        ))}

      <AccessibilityChecker
        targetRef={Component ? previewPaneRef : NO_CANVAS_REF}
        isEnabled={isAccessibilityEnabled}
        onPin={handlePin}
        onHover={setHoveredTarget}
        pinnedTarget={pinnedTarget}
        scanKey={preview}
      />

      {/* A pin outranks a hover, so moving the pointer away keeps the pin visible. */}
      <HighlightOverlay
        target={pinnedTarget ?? hoveredTarget}
        pinned={pinnedTarget !== null}
        clipTo={previewPaneRef}
      />
    </div>
  )
}
