import type { ControlDef } from '@react-foundry/core'
import { type ReactNode, useId } from 'react'

import { controlFieldStyles as s } from './control-field.css'

type ControlValue = string | number | boolean

interface ControlFieldProps {
  name: string
  def: ControlDef
  value: ControlValue
  onChange: (value: ControlValue) => void
  /** Drawn beside the label: the info mark for the prop this control drives. */
  info?: ReactNode
}

/**
 * De-camelCases a control name for its label, matching nav leaf labels. Exported
 * for the props panel, which labels a control group the same way.
 */
export function labelFor(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/^./, (c) => c.toUpperCase())
}

/**
 * The label a control shows: the one its schema declares, else its name
 * humanized. Exported for the list field, which labels a list the same way.
 */
export function labelOf(name: string, def: { label?: string }): string {
  return def.label ?? labelFor(name)
}

/**
 * A single labelled control input. Fully controlled: it renders `value` and
 * reports changes through `onChange`. Debouncing and URL writes are the panel's
 * job, so this stays pure and easy to test.
 */
export function ControlField({ name, def, value, onChange, info }: ControlFieldProps) {
  const id = useId()
  const label = labelOf(name, def)

  // The label and, beside it, the info mark. The mark sits outside the <label>
  // so that pressing it focuses nothing but itself.
  const heading = (
    <span className={s.labelRow}>
      <label className={s.label} htmlFor={id}>
        {label}
      </label>
      {info}
    </span>
  )

  if (def.type === 'boolean') {
    return (
      <span className={s.inlineField}>
        <input
          id={id}
          type="checkbox"
          className={s.checkbox}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {heading}
      </span>
    )
  }

  if (def.type === 'select') {
    return (
      <div className={s.field}>
        {heading}
        <select
          id={id}
          className={s.input}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          {def.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (def.type === 'radio') {
    return (
      <div className={s.field}>
        <span className={s.labelRow}>
          <span className={s.label} id={id}>
            {label}
          </span>
          {info}
        </span>
        <div className={s.radioGroup} role="radiogroup" aria-labelledby={id}>
          {def.options.map((option) => (
            <label key={option} className={s.radioOption}>
              <input
                type="radio"
                className={s.radioInput}
                name={id}
                value={option}
                checked={String(value) === option}
                onChange={() => onChange(option)}
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    )
  }

  if (def.type === 'range') {
    return (
      <div className={s.field}>
        {heading}
        <div className={s.rangeRow}>
          <input
            id={id}
            type="range"
            className={s.range}
            min={def.min}
            max={def.max}
            step={def.step}
            value={Number(value)}
            onChange={(e) => onChange(e.target.valueAsNumber)}
          />
          <span className={s.rangeValue}>{String(value)}</span>
        </div>
      </div>
    )
  }

  if (def.type === 'number') {
    return (
      <div className={s.field}>
        {heading}
        <input
          id={id}
          type="number"
          className={s.input}
          autoComplete="off"
          min={def.min}
          max={def.max}
          step={def.step}
          value={Number(value)}
          onChange={(e) => onChange(e.target.valueAsNumber)}
        />
      </div>
    )
  }

  if (def.type === 'color') {
    return (
      <span className={s.inlineField}>
        <input
          id={id}
          type="color"
          className={s.color}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
        {heading}
      </span>
    )
  }

  // text
  return (
    <div className={s.field}>
      {heading}
      <input
        id={id}
        type="text"
        className={s.input}
        autoComplete="off"
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}
