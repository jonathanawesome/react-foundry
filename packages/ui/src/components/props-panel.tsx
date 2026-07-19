import type { ControlSchema } from '@react-foundry/core'

import { useUIStore } from '../state'
import { propsPanelStyles } from './props-panel.css'

interface PropsPanelProps {
  /** The active preview's controls, or undefined when it has none. */
  controls?: ControlSchema
}

/**
 * Right-side panel for a preview's controls. Mirrors the shelf: reserves its
 * gutter whenever pinned, so an uncontrolled preview shows an empty state
 * rather than the panel collapsing.
 *
 * This commit is the shell — the control inputs and URL wiring land next.
 */
export function PropsPanel({ controls }: PropsPanelProps) {
  const isPanelOpen = useUIStore.use.isPanelOpen()
  const isPanelPinned = useUIStore.use.isPanelPinned()

  const names = controls ? Object.keys(controls) : []

  return (
    <aside
      className={propsPanelStyles.panel}
      data-open={isPanelOpen}
      data-pinned={isPanelPinned}
    >
      <div className={propsPanelStyles.header}>Controls</div>
      <div className={propsPanelStyles.content}>
        {names.length === 0 ? (
          <p className={propsPanelStyles.empty}>This preview has no controls.</p>
        ) : (
          names.map((name) => (
            <div key={name} className={propsPanelStyles.empty}>
              {name}
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
