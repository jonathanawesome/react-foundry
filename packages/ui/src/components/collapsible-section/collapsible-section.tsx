import { type ReactNode, useState } from 'react'

import { IconButton } from '../icon-button/icon-button'
import { Tooltip } from '../tooltip/tooltip'
import { collapsibleSectionStyles as s } from './collapsible-section.css'

export interface CollapsibleSectionProps {
  /** The section's name, drawn as the legend on the left of the border line. */
  label: string
  /** Drawn beside the name in the legend: the info mark for the prop this section drives. */
  info?: ReactNode
  /** Drawn a step tighter, for a section nested inside another. */
  tight?: boolean
  /**
   * Controls that belong to the section as a whole, drawn on the border line
   * beside the caret so they stay reachable while it is collapsed.
   */
  actions?: ReactNode
  children: ReactNode
}

/**
 * A labelled section of the props panel that folds shut.
 *
 * A fieldset, so the label is the group's accessible name, with the legend on
 * the left of the top border and a caret on the right of it. Open by default,
 * and the state is the section's own: it lasts as long as the panel does, which
 * remounts when the preview changes.
 *
 * Collapsed content is not rendered rather than hidden. Every field in the panel
 * is controlled from the panel's draft, so nothing is lost, and a `hidden`
 * attribute would lose to the content's own `display` anyway.
 */
export function CollapsibleSection({
  label,
  info,
  tight = false,
  actions,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(true)
  const toggleLabel = `${open ? 'Collapse' : 'Expand'} ${label.toLowerCase()}`

  return (
    <fieldset className={s.section({ tight })} data-open={open}>
      <legend className={s.label}>
        {label}
        {info}
      </legend>
      <div className={s.header}>
        {actions}
        <Tooltip label={toggleLabel}>
          <IconButton
            icon="CaretRight"
            rotate={open ? '90' : undefined}
            size="sm"
            title={toggleLabel}
            nativeTooltip={false}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          />
        </Tooltip>
      </div>
      {open && <div className={s.content({ tight })}>{children}</div>}
    </fieldset>
  )
}
