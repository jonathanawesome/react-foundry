import {
  coerceControlValues,
  type Preview as PreviewComponent,
} from '@react-foundry/core'
import { useSearch } from '@tanstack/react-router'
import { useRef } from 'react'

import { useUIStore } from '../state'

import { AccessibilityChecker } from './accessibility-checker'
import { previewStyles } from './preview.css'

interface PreviewProps {
  preview: PreviewComponent | null
  /** Shown when nothing is selected. */
  emptyMessage?: string
}

export function Preview({
  preview,
  emptyMessage = 'Select a preview from the sidebar',
}: PreviewProps) {
  const previewPaneRef = useRef<HTMLDivElement>(null)

  const isAccessibilityEnabled = useUIStore.use.isAccessibilityEnabled()
  const isShelfOpen = useUIStore.use.isShelfOpen()
  const isPanelOpen = useUIStore.use.isPanelOpen()

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
        <div className={previewStyles.previewPane} ref={previewPaneRef}>
          <Component controlValues={controlValues} />
        </div>
      ) : (
        <div className={previewStyles.noSelection}>{emptyMessage}</div>
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
