import {
  coerceControlValues,
  type FoundryProvider,
  type Preview as PreviewComponent,
} from '@react-foundry/core'
import { chromeSurface, ThemeContext } from '@react-foundry/style'
import { useSearch } from '@tanstack/react-router'
import { useContext, useRef } from 'react'

import { useUIStore } from '../state'

import { AccessibilityChecker } from './accessibility-checker'
import { previewStyles } from './preview.css'

/** Used when the consumer has no `foundry.providers.tsx`: render the preview as-is. */
const PassthroughProvider: FoundryProvider = ({ children }) => children

interface PreviewProps {
  preview: PreviewComponent | null
  /** Shown when nothing is selected. */
  emptyMessage?: string
  /** The consumer's global provider, wrapped around the rendered preview. */
  Provider?: FoundryProvider
}

export function Preview({
  preview,
  emptyMessage = 'Select a preview from the sidebar',
  Provider = PassthroughProvider,
}: PreviewProps) {
  const previewPaneRef = useRef<HTMLDivElement>(null)

  const isAccessibilityEnabled = useUIStore.use.isAccessibilityEnabled()
  const isShelfOpen = useUIStore.use.isShelfOpen()
  const isPanelOpen = useUIStore.use.isPanelOpen()

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
      {Component ? (
        // data-foundry-canvas marks the reset boundary: foundry's appearance resets
        // (global-styles.css.ts) deliberately do not reach the consumer's component.
        // The consumer's Provider wraps inside it, so app context reaches the preview
        // without foundry's chrome resets touching it.
        <div
          className={previewStyles.previewPane}
          ref={previewPaneRef}
          data-foundry-canvas
        >
          <Provider theme={theme}>
            <Component controlValues={controlValues} />
          </Provider>
        </div>
      ) : (
        <div className={`${chromeSurface} ${previewStyles.noSelection}`}>
          {emptyMessage}
        </div>
      )}

      <AccessibilityChecker
        targetRef={previewPaneRef}
        isEnabled={isAccessibilityEnabled}
        isShelfOpen={isShelfOpen}
        isPanelOpen={isPanelOpen}
      />
    </div>
  )
}
