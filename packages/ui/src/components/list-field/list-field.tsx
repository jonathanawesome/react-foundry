import {
  type ControlDef,
  isControlDef,
  type ListControlDef,
  listRowDefault,
} from '@react-foundry/core'
import type { ReactNode } from 'react'

import { CollapsibleSection } from '../collapsible-section/collapsible-section'
import { ControlField, labelOf } from '../control-field/control-field'
import { Icon } from '../icon/icon'
import { IconButton } from '../icon-button/icon-button'
import { Tooltip } from '../tooltip/tooltip'
import { listFieldStyles as s } from './list-field.css'

type ControlValue = string | number | boolean

/** One row as the panel holds it: a scalar, or the values of a group schema. */
export type ListRowValue = ControlValue | Record<string, ControlValue>

interface ListFieldProps {
  name: string
  def: ListControlDef
  rows: ListRowValue[]
  /** Drawn beside the list's name: the info mark for the prop it drives. */
  info?: ReactNode
  /**
   * A change to one field of one row. `member` names the field inside a group
   * row and is null for a scalar row, whose value is the field.
   */
  onRowChange: (
    index: number,
    member: string | null,
    def: ControlDef,
    value: ControlValue
  ) => void
  /** A change to the rows themselves: one added or one removed. */
  onRowsChange: (rows: ListRowValue[]) => void
}

/**
 * The panel's input for a list control: a section per row, drawn from the list's
 * `of` schema, with a remove button on each and an add button at the end. The
 * list and each group row fold shut, so a long list can be read as its labels.
 *
 * Controlled, like {@link ControlField}: it renders `rows` and reports changes
 * through the two callbacks, so debouncing and URL writes stay the panel's job.
 * Field edits go through `onRowChange` so the panel can debounce a continuous
 * control the same way it does at the top level; adding and removing go through
 * `onRowsChange` and are discrete.
 *
 * Rows are keyed by index. They carry no identity of their own, every input is
 * controlled, and a removed row's successors take its place in the same fields.
 */
export function ListField({
  name,
  def,
  rows,
  info,
  onRowChange,
  onRowsChange,
}: ListFieldProps) {
  const label = labelOf(name, def)
  const rowLabel = (index: number) => `Row ${index + 1}`

  const remove = (index: number) => onRowsChange(rows.filter((_, i) => i !== index))
  const add = () => onRowsChange([...rows, listRowDefault(def) as ListRowValue])

  return (
    <CollapsibleSection label={label} info={info}>
      {rows.map((row, index) =>
        isControlDef(def.of) ? (
          // A scalar row is one field, labelled as the row since the field is the row.
          // The list carries the schema's label, so the row schema's own is set aside
          // rather than repeated on every row.
          <div key={index} className={s.scalarRow}>
            <div className={s.scalarField}>
              <ControlField
                name={rowLabel(index)}
                def={{ ...def.of, label: undefined }}
                value={row as ControlValue}
                onChange={(value) =>
                  onRowChange(index, null, def.of as ControlDef, value)
                }
              />
            </div>
            <Tooltip label={`Remove ${rowLabel(index).toLowerCase()}`}>
              <IconButton
                icon="X"
                title={`Remove ${rowLabel(index).toLowerCase()}`}
                nativeTooltip={false}
                onClick={() => remove(index)}
              />
            </Tooltip>
          </div>
        ) : (
          <CollapsibleSection
            key={index}
            label={rowLabel(index)}
            tight
            actions={
              <Tooltip label={`Remove ${rowLabel(index).toLowerCase()}`}>
                <IconButton
                  icon="X"
                  size="sm"
                  title={`Remove ${rowLabel(index).toLowerCase()}`}
                  nativeTooltip={false}
                  onClick={() => remove(index)}
                />
              </Tooltip>
            }
          >
            {Object.entries(def.of).map(([member, memberDef]) => (
              <ControlField
                key={member}
                name={member}
                def={memberDef}
                value={(row as Record<string, ControlValue>)[member] as ControlValue}
                onChange={(value) => onRowChange(index, member, memberDef, value)}
              />
            ))}
          </CollapsibleSection>
        )
      )}

      <button type="button" className={s.add} onClick={add}>
        <Icon name="Plus" size="sm" />
        Add row
      </button>
    </CollapsibleSection>
  )
}
