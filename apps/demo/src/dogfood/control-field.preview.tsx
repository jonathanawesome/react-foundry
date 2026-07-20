import type { ControlDef, NavPath } from '@react-foundry/core'
import { createPreview } from '@react-foundry/core'
import { ControlField } from '@react-foundry/ui'
import { useState } from 'react'

export const nav: NavPath = 'Dogfood/Control Field'

/**
 * Wraps a ControlField in local state so it is interactive in the canvas. This
 * is foundry previewing its own panel input primitive.
 */
function Field({
  def,
  initial,
}: {
  def: ControlDef
  initial: string | number | boolean
}) {
  const [value, setValue] = useState(initial)

  return (
    <div style={{ minWidth: 240 }}>
      <ControlField name="example" def={def} value={value} onChange={setValue} />
      <p style={{ marginTop: 16, fontSize: 13, color: '#888' }}>
        value: {JSON.stringify(value)}
      </p>
    </div>
  )
}

export const Text = createPreview(() => (
  <Field def={{ type: 'text', default: 'Hello' }} initial="Hello" />
))

export const BooleanField = createPreview({
  label: 'Boolean',
  render: () => <Field def={{ type: 'boolean', default: false }} initial={false} />,
})

export const Select = createPreview(() => (
  <Field
    def={{ type: 'select', options: ['primary', 'secondary', 'danger'] }}
    initial="primary"
  />
))

export const Radio = createPreview(() => (
  <Field
    def={{ type: 'radio', options: ['small', 'medium', 'large'] }}
    initial="medium"
  />
))

export const NumberField = createPreview({
  label: 'Number',
  render: () => (
    <Field def={{ type: 'number', min: 0, max: 100, step: 5 }} initial={20} />
  ),
})

export const Range = createPreview(() => (
  <Field def={{ type: 'range', min: 0, max: 100, step: 1 }} initial={40} />
))

export const Color = createPreview(() => (
  <Field def={{ type: 'color', default: '#0ea5e9' }} initial="#0ea5e9" />
))
