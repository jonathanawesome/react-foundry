import { createPreview, type NavPath } from '@react-foundry/core'
import { IconButton } from '@react-foundry/ui'
import { useState } from 'react'

export const nav: NavPath = 'Dogfood/Icon Button'

export const Default = createPreview(() => (
  <IconButton icon="Notebook" title="Notebook" onClick={() => {}} />
))

export const Active = createPreview(() => (
  <IconButton icon="Sliders" title="Sliders" active onClick={() => {}} />
))

export const Toggles = createPreview({
  label: 'Click to Toggle',
  render: () => {
    const [on, setOn] = useState(false)

    return (
      <IconButton
        icon="Moon"
        title={on ? 'On' : 'Off'}
        active={on}
        onClick={() => setOn(!on)}
      />
    )
  },
})

export const Row = createPreview(() => (
  <div style={{ display: 'flex', gap: 4 }}>
    <IconButton icon="Notebook" title="Notebook" active onClick={() => {}} />
    <IconButton icon="Sliders" title="Sliders" onClick={() => {}} />
    <IconButton icon="Moon" title="Theme" onClick={() => {}} />
    <IconButton icon="Wheelchair" title="Accessibility" onClick={() => {}} />
  </div>
))
