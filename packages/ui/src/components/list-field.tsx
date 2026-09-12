import {
  type ControlDef,
  isControlDef,
  type ListControlDef,
  listRowDefault,
} from '@react-foundry/core'

import { ControlField, labelFor } from './control-field'
import { Icon } from './icon/icon'
import { IconButton } from './icon-button'
import { listFieldStyles as s } from './list-field.css'

type ControlValue = string | number | boolean

/** One row as the panel holds it: a scalar, or the values of a group schema. */
export type ListRowValue = ControlValue | Record<string, ControlValue>

interface ListFieldProps {
  name: string
  def: ListControlDef
  rows: ListRowValue[]
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
 * `of` schema, with a remove button on each and an add button at the end.
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
  onRowChange,
  onRowsChange,
}: ListFieldProps) {
  const label = labelFor(name)
  const rowLabel = (index: number) => `Row ${index + 1}`

  const remove = (index: number) => onRowsChange(rows.filter((_, i) => i !== index))
  const add = () => onRowsChange([...rows, listRowDefault(def) as ListRowValue])

  return (
    <fieldset className={s.list}>
      <legend className={s.label}>{label}</legend>

      {rows.map((row, index) =>
        isControlDef(def.of) ? (
          // A scalar row is one field, labelled as the row since the field is the row.
          <div key={index} className={s.scalarRow}>
            <div className={s.scalarField}>
              <ControlField
                name={rowLabel(index)}
                def={def.of}
                value={row as ControlValue}
                onChange={(value) =>
                  onRowChange(index, null, def.of as ControlDef, value)
                }
              />
            </div>
            <IconButton
              icon="X"
              title={`Remove ${rowLabel(index).toLowerCase()}`}
              onClick={() => remove(index)}
            />
          </div>
        ) : (
          <fieldset key={index} className={s.row}>
            <legend className={s.rowLabel}>{rowLabel(index)}</legend>
            <IconButton
              icon="X"
              title={`Remove ${rowLabel(index).toLowerCase()}`}
              className={s.remove}
              onClick={() => remove(index)}
            />
            {Object.entries(def.of).map(([member, memberDef]) => (
              <ControlField
                key={member}
                name={member}
                def={memberDef}
                value={(row as Record<string, ControlValue>)[member] as ControlValue}
                onChange={(value) => onRowChange(index, member, memberDef, value)}
              />
            ))}
          </fieldset>
        )
      )}

      <button type="button" className={s.add} onClick={add}>
        <Icon name="Plus" size="sm" />
        Add row
      </button>
    </fieldset>
  )
}
