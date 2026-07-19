import { createPreview, defineControls, type NavPath } from '@react-foundry/core'
import { useState } from 'react'

import { Button } from './button'

export const nav: NavPath = 'Components/Actions'

// Extracted so it can be reused across previews. defineControls keeps the literal
// option types, so `v.variant`/`v.size` narrow to their unions with no casts.
const buttonControls = defineControls({
  children: { type: 'text', default: 'Click me' },
  variant: {
    type: 'select',
    options: ['primary', 'secondary', 'danger'],
    default: 'primary',
  },
  size: { type: 'radio', options: ['small', 'medium', 'large'], default: 'medium' },
  disabled: { type: 'boolean', default: false },
})

// Controlled: every prop is a control, tweakable live from the panel. `children`
// as a control name is fine — it is a key in the values object, not JSX children.
export const Playground = createPreview({
  controls: buttonControls,
  render: (v) => (
    <Button variant={v.variant} size={v.size} disabled={v.disabled}>
      {v.children}
    </Button>
  ),
})

// The same schema reused, showing controls are not one-per-preview.
export const DangerPlayground = createPreview({
  label: 'Danger Playground',
  controls: {
    ...buttonControls,
    variant: { ...buttonControls.variant, default: 'danger' },
  },
  render: (v) => (
    <Button variant={v.variant} size={v.size} disabled={v.disabled}>
      {v.children}
    </Button>
  ),
})

export const Primary = createPreview(() => (
  <Button variant="primary">Primary Button</Button>
))

export const Secondary = createPreview(() => (
  <Button variant="secondary">Secondary Button</Button>
))

export const Danger = createPreview(() => <Button variant="danger">Danger Button</Button>)

export const Small = createPreview(() => <Button size="small">Small Button</Button>)

export const Large = createPreview(() => <Button size="large">Large Button</Button>)

export const Disabled = createPreview(() => <Button disabled>Disabled Button</Button>)

// A stateful preview is the same primitive as the ones above.
export const Interactive = createPreview({
  controls: buttonControls,
  label: 'Interactive Example',
  render: () => {
    const [count, setCount] = useState(0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <p style={{ marginBottom: '8px' }}>Click count: {count}</p>
          <Button onClick={() => setCount(count + 1)}>Increment Counter</Button>
        </div>
      </div>
    )
  },
})

export const AllVariants = createPreview(() => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="danger">Danger</Button>
    </div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button size="small">Small</Button>
      <Button size="medium">Medium</Button>
      <Button size="large">Large</Button>
    </div>
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      <Button disabled>Disabled</Button>
    </div>
  </div>
))
