import {
  type ControlDef,
  type ControlSchema,
  coerceControlValues,
  encodeControlValues,
  isControlDef,
} from '@react-foundry/core'
import { chromeSurfaceProps } from '@react-foundry/style'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useRef, useState } from 'react'

import { useUIStore } from '../state'
import { ControlField, labelFor } from './control-field'
import { propsPanelStyles } from './props-panel.css'
import { Scrollable } from './scrollable'

type ControlValue = string | number | boolean

/** The draft, read loosely: a group entry holds a nested record of values. */
type DraftValues = Record<string, ControlValue | Record<string, ControlValue>>

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

  const values = draft as DraftValues

  /**
   * Writes one control's value into the draft. `group` names the object prop a
   * control belongs to, so a group member replaces its own key inside the nested
   * object rather than the whole group.
   */
  const handleChange = (
    group: string | null,
    name: string,
    def: ControlDef,
    value: ControlValue
  ) => {
    const next = group
      ? {
          ...values,
          [group]: { ...(values[group] as Record<string, ControlValue>), [name]: value },
        }
      : { ...values, [name]: value }

    setDraft(next as typeof draft)

    if (isContinuous(def)) {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => writeUrl(next as typeof draft), 200)
    } else {
      writeUrl(next as typeof draft)
    }
  }

  return (
    <>
      {Object.entries(controls).map(([name, entry]) =>
        isControlDef(entry) ? (
          <ControlField
            key={name}
            name={name}
            def={entry}
            value={values[name] as ControlValue}
            onChange={(value) => handleChange(null, name, entry, value)}
          />
        ) : (
          <fieldset key={name} className={propsPanelStyles.group}>
            <legend className={propsPanelStyles.groupLabel}>{labelFor(name)}</legend>
            {Object.entries(entry).map(([member, def]) => (
              <ControlField
                key={member}
                name={member}
                def={def}
                value={(values[name] as Record<string, ControlValue>)[member]}
                onChange={(value) => handleChange(name, member, def, value)}
              />
            ))}
          </fieldset>
        )
      )}
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
    <aside {...chromeSurfaceProps(propsPanelStyles.panel)} data-open={isPanelOpen}>
      <div className={propsPanelStyles.header}>Controls</div>
      <Scrollable className={propsPanelStyles.content}>
        {hasControls ? (
          <PanelControls key={splat} controls={controls} splat={splat} />
        ) : (
          <p className={propsPanelStyles.empty}>This preview has no controls.</p>
        )}
      </Scrollable>
    </aside>
  )
}
