import {
  type ControlDef,
  type ControlEntry,
  type ControlGroup,
  isControlDef,
  isListControlDef,
  type PropDoc,
} from '@react-foundry/core'

import { IconButton } from '../icon-button/icon-button'
import { Tooltip } from '../tooltip/tooltip'
import { propInfoStyles as s } from './prop-info.css'

export interface PropInfoProps {
  /** The control's key, which is the name of the prop it drives. */
  name: string
  /** The control entry, which stands in for the prop when no doc is known. */
  entry: ControlEntry
  /** The prop as declared on the component, when the dev server could read it. */
  doc?: PropDoc
}

/**
 * The info mark beside a control's name: hover or focus it for the prop the
 * control drives, as declared on the component, with its description.
 *
 * The signature always starts with the prop's real name, so a control given a
 * `label` still says which prop it is. Where no doc is known, a schema built
 * with `defineControls` or a project without TypeScript, the control's own
 * definition stands in: its kind, options or range, and default.
 *
 * A button rather than a bare icon so it takes focus, which is what lets the
 * tooltip open from the keyboard; it does nothing when pressed. Its accessible
 * name carries the same words the bubble shows, since the bubble itself is
 * hidden from assistive tech.
 */
export function PropInfo({ name, entry, doc }: PropInfoProps) {
  const signature = doc ? describeProp(doc) : describeControl(name, entry)

  return (
    <Tooltip
      label={<code className={s.signature}>{signature}</code>}
      detail={doc?.description}
    >
      <IconButton
        icon="Info"
        size="sm"
        title={doc?.description ? `${signature}. ${doc.description}` : signature}
        nativeTooltip={false}
        onClick={() => {}}
      />
    </Tooltip>
  )
}

/** `variant?: 'primary' | 'danger'`, as the prop is declared. */
export function describeProp(doc: PropDoc): string {
  return `${doc.name}${doc.optional ? '?' : ''}: ${doc.type}`
}

/**
 * A control's definition in the same shape as a prop signature, for when the
 * prop itself cannot be read: `variant: select 'primary' | 'danger' = 'primary'`.
 */
export function describeControl(name: string, entry: ControlEntry): string {
  return `${name}: ${describeEntry(entry)}`
}

function describeEntry(entry: ControlEntry): string {
  if (isListControlDef(entry)) return `list of ${describeEntry(entry.of)}`
  if (isControlDef(entry)) return describeDef(entry)
  return describeGroup(entry)
}

function describeGroup(group: ControlGroup): string {
  const members = Object.entries(group).map(
    ([member, def]) => `${member}: ${describeDef(def)}`
  )
  return `{ ${members.join(', ')} }`
}

function describeDef(def: ControlDef): string {
  const fallback = def.default === undefined ? '' : ` = ${JSON.stringify(def.default)}`

  switch (def.type) {
    case 'select':
    case 'radio':
      return `${def.type} ${def.options.map((option) => JSON.stringify(option)).join(' | ')}${fallback}`
    case 'number':
    case 'range': {
      const bounds =
        def.min !== undefined || def.max !== undefined
          ? ` ${def.min ?? ''}…${def.max ?? ''}`
          : ''
      const step = def.step !== undefined ? ` step ${def.step}` : ''
      return `${def.type}${bounds}${step}${fallback}`
    }
    default:
      return `${def.type}${fallback}`
  }
}
