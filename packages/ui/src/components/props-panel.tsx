import {
  type ControlDef,
  type ControlSchema,
  coerceControlValues,
  encodeControlValues,
} from '@react-foundry/core'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { useUIStore } from '../state'
import { ControlField } from './control-field'
import { propsPanelStyles } from './props-panel.css'

type ControlValue = string | number | boolean

/** Continuous controls debounce their URL write so typing/dragging isn't spammy. */
function isContinuous(def: ControlDef): boolean {
  return def.type === 'text' || def.type === 'number' || def.type === 'range'
}

interface PanelControlsProps {
  controls: ControlSchema
  splat: string
}

/**
 * The live control inputs. Keyed by the active preview in {@link PropsPanel}, so
 * it remounts and re-seeds its draft from the URL when you switch previews.
 *
 * The draft is the source of truth for the inputs, so they stay responsive
 * regardless of the URL round-trip. Writes use `replace`, so control edits never
 * push history — which also means there is no back-button state to sync back in.
 */
function PanelControls({ controls, splat }: PanelControlsProps) {
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()

  const [draft, setDraft] = useState(() => coerceControlValues(controls, search))
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const writeUrl = (next: typeof draft) => {
    navigate({
      to: '/$',
      params: { _splat: splat },
      search: encodeControlValues(controls, next),
      replace: true,
    })
  }

  const handleChange = (name: string, def: ControlDef, value: ControlValue) => {
    const next = { ...draft, [name]: value }
    setDraft(next)

    if (isContinuous(def)) {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => writeUrl(next), 200)
    } else {
      writeUrl(next)
    }
  }

  return (
    <>
      {Object.entries(controls).map(([name, def]) => (
        <ControlField
          key={name}
          name={name}
          def={def}
          value={(draft as Record<string, ControlValue>)[name]}
          onChange={(value) => handleChange(name, def, value)}
        />
      ))}
    </>
  )
}

interface PropsPanelProps {
  /** The active preview's controls, or undefined when it has none. */
  controls?: ControlSchema
}

/**
 * Right-side panel for a preview's controls. Mirrors the shelf: reserves its
 * gutter whenever pinned, so an uncontrolled preview shows an empty state.
 */
export function PropsPanel({ controls }: PropsPanelProps) {
  const isPanelOpen = useUIStore.use.isPanelOpen()

  const params = useParams({ strict: false })
  const splat = '_splat' in params ? ((params._splat as string) ?? '') : ''

  const hasControls = controls && Object.keys(controls).length > 0

  return (
    <aside className={propsPanelStyles.panel} data-open={isPanelOpen}>
      <div className={propsPanelStyles.header}>Controls</div>
      <div className={propsPanelStyles.content}>
        {hasControls ? (
          <PanelControls key={splat} controls={controls} splat={splat} />
        ) : (
          <p className={propsPanelStyles.empty}>This preview has no controls.</p>
        )}
      </div>
    </aside>
  )
}
