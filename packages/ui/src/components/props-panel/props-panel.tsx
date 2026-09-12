import {
  type ControlDef,
  type ControlDocs,
  type ControlSchema,
  coerceControlValues,
  encodeControlValues,
  isControlDef,
  isListControlDef,
} from '@react-foundry/core'
import { chromeSurfaceProps } from '@react-foundry/style'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'

import { useUIStore } from '../../state'
import { CollapsibleSection } from '../collapsible-section/collapsible-section'
import { ControlField, labelFor } from '../control-field/control-field'
import { ListField, type ListRowValue } from '../list-field/list-field'
import { PropInfo } from '../prop-info/prop-info'
import { Scrollable } from '../scrollable/scrollable'
import { propsPanelStyles } from './props-panel.css'

/** Fetches a preview's control docs, which the dev server reads on demand. */
type DocsLoader = () => Promise<ControlDocs | undefined>

type ControlValue = string | number | boolean

/**
 * The draft, read loosely: a group entry holds a nested record of values, a list
 * entry an array of rows.
 */
type DraftValues = Record<
  string,
  ControlValue | Record<string, ControlValue> | ListRowValue[]
>

/**
 * Where one control's value sits in the draft: a top-level control, a member of
 * a group, a scalar row of a list, or a member of a row in a list.
 */
type ValuePath =
  | [name: string]
  | [group: string, member: string]
  | [list: string, index: number]
  | [list: string, index: number, member: string]

/**
 * Writes one value into the draft at a path, copying what it passes through so
 * the draft stays a fresh object at every level React compares.
 */
function setAtPath(
  values: DraftValues,
  path: ValuePath,
  value: ControlValue
): DraftValues {
  const [name, second, member] = path
  if (second === undefined) return { ...values, [name]: value }
  if (typeof second === 'string') {
    return {
      ...values,
      [name]: { ...(values[name] as Record<string, ControlValue>), [second]: value },
    }
  }

  const rows = [...(values[name] as ListRowValue[])]
  rows[second] =
    member === undefined
      ? value
      : { ...(rows[second] as Record<string, ControlValue>), [member]: value }
  return { ...values, [name]: rows }
}

/** Continuous controls debounce their URL write so typing/dragging isn't spammy. */
function isContinuous(def: ControlDef): boolean {
  return def.type === 'text' || def.type === 'number' || def.type === 'range'
}

interface PanelControlsProps {
  controls: ControlSchema
  docs?: DocsLoader
  splat: string
}

/**
 * The docs for the active preview, fetched once it is on screen. Undefined until
 * they arrive and where there are none, and the info marks show the control's
 * own definition in the meantime, so nothing waits on the checker.
 */
function useControlDocs(load: DocsLoader | undefined): ControlDocs | undefined {
  const [docs, setDocs] = useState<ControlDocs>()

  useEffect(() => {
    if (!load) return
    let current = true
    load()
      .then((loaded) => {
        if (current) setDocs(loaded)
      })
      .catch(() => {})
    return () => {
      current = false
    }
  }, [load])

  return docs
}

/**
 * The live control inputs. Keyed by the active preview in {@link PropsPanel}, so
 * it remounts and re-seeds its draft from the URL when you switch previews.
 *
 * The draft is the source of truth for the inputs, so they stay responsive
 * regardless of the URL round-trip. Writes use `replace`, so control edits never
 * push history — which also means there is no back-button state to sync back in.
 */
function PanelControls({ controls, docs: loadDocs, splat }: PanelControlsProps) {
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const navigate = useNavigate()
  const docs = useControlDocs(loadDocs)

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
   * Writes one control's value into the draft, wherever it sits, and to the URL:
   * at once for a discrete control, after a pause for a continuous one, so typing
   * into a row's text field is no spammier than typing at the top level.
   */
  const handleChange = (path: ValuePath, def: ControlDef, value: ControlValue) => {
    const next = setAtPath(values, path, value)

    setDraft(next as typeof draft)

    if (isContinuous(def)) {
      if (timer.current) clearTimeout(timer.current)
      timer.current = setTimeout(() => writeUrl(next as typeof draft), 200)
    } else {
      writeUrl(next as typeof draft)
    }
  }

  /** Replaces a list's rows outright, on an add or a remove. Discrete, so written at once. */
  const handleRowsChange = (name: string, rows: ListRowValue[]) => {
    const next = { ...values, [name]: rows }

    setDraft(next as typeof draft)
    writeUrl(next as typeof draft)
  }

  const infoFor = (name: string, entry: ControlDef | ControlSchema[string]) => (
    <PropInfo name={name} entry={entry} doc={docs?.[name]} />
  )

  return (
    <>
      {Object.entries(controls).map(([name, entry]) =>
        isControlDef(entry) ? (
          <ControlField
            key={name}
            name={name}
            def={entry}
            value={values[name] as ControlValue}
            onChange={(value) => handleChange([name], entry, value)}
            info={infoFor(name, entry)}
          />
        ) : isListControlDef(entry) ? (
          <ListField
            key={name}
            name={name}
            def={entry}
            rows={values[name] as ListRowValue[]}
            info={infoFor(name, entry)}
            onRowChange={(index, member, def, value) =>
              handleChange(
                member === null ? [name, index] : [name, index, member],
                def,
                value
              )
            }
            onRowsChange={(rows) => handleRowsChange(name, rows)}
          />
        ) : (
          <CollapsibleSection
            key={name}
            label={labelFor(name)}
            info={infoFor(name, entry)}
          >
            {Object.entries(entry).map(([member, def]) => (
              <ControlField
                key={member}
                name={member}
                def={def}
                value={(values[name] as Record<string, ControlValue>)[member]}
                onChange={(value) => handleChange([name, member], def, value)}
              />
            ))}
          </CollapsibleSection>
        )
      )}
    </>
  )
}

interface PropsPanelProps {
  /** The active preview's controls, or undefined when it has none. */
  controls?: ControlSchema
  /**
   * Fetches the docs for those controls: each prop as declared on the component,
   * read by the dev server. Undefined where it could read none.
   */
  docs?: DocsLoader
}

/**
 * Right-side panel for a preview's controls. Mirrors the shelf: reserves its
 * gutter whenever pinned, so an uncontrolled preview shows an empty state.
 */
export function PropsPanel({ controls, docs }: PropsPanelProps) {
  const isPanelOpen = useUIStore.use.isPanelOpen()

  const params = useParams({ strict: false })
  const splat = '_splat' in params ? ((params._splat as string) ?? '') : ''

  const hasControls = controls && Object.keys(controls).length > 0

  return (
    <aside {...chromeSurfaceProps(propsPanelStyles.panel)} data-open={isPanelOpen}>
      <div className={propsPanelStyles.header}>Controls</div>
      <Scrollable className={propsPanelStyles.content}>
        {hasControls ? (
          <PanelControls key={splat} controls={controls} docs={docs} splat={splat} />
        ) : (
          <p className={propsPanelStyles.empty}>This preview has no controls.</p>
        )}
      </Scrollable>
    </aside>
  )
}
