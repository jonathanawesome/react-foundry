import { useState } from 'react'
import { controlsFor, createPreview, type NavPath } from 'react-foundry'

import { Button } from './button'

export const nav: NavPath = 'Demo/Actions/Button'

// Extracted so it can be reused across previews. controlsFor keeps the literal option
// types, so `v.variant`/`v.size` narrow to their unions with no casts, and checks every
// control against Button's own props: a name Button does not have, a control type the
// prop cannot take, or a typo inside `options` is a compile error rather than a panel
// offering a variant no call site can produce.
const buttonControls = controlsFor(Button, {
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

export const Derived = createPreview({
  controls: controlsFor(Button, {
    children: {
      type: 'range',
      min: 1,
      max: 5,
      default: 2,
      derive: (n) => 'Go!!! '.repeat(n).trim(),
    },
    variant: {
      type: 'select',
      options: ['primary', 'secondary', 'danger'],
      default: 'primary',
    },
  }),
  render: (v) => <Button variant={v.variant}>{v.children}</Button>,
})

// The same schema reused, showing controls are not one-per-preview. Derived through
// controlsFor as well, so overriding a default does not quietly opt back out of the
// checking that buttonControls above is getting.
export const DangerPlayground = createPreview({
  label: 'Danger Playground',
  controls: controlsFor(Button, {
    ...buttonControls,
    variant: { ...buttonControls.variant, default: 'danger' },
  }),
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

// A stateful preview is the same primitive as the ones above: render is mounted as a
// component, so the count lives right here, and a control edit re-renders it with the
// new props rather than remounting it. Click a few times, then change the variant.
export const Interactive = createPreview({
  controls: buttonControls,
  label: 'Interactive Example',
  render: (v) => {
    const [count, setCount] = useState(0)

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <p style={{ marginBottom: '8px' }}>Click count: {count}</p>
          <Button
            variant={v.variant}
            size={v.size}
            disabled={v.disabled}
            onClick={() => setCount(count + 1)}
          >
            {v.children}
          </Button>
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
