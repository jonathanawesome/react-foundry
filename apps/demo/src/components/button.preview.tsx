import { createPreview, type NavPath } from '@react-foundry/core'
import { useState } from 'react'

import { Button } from './button'

export const nav: NavPath = 'UI Components/Button'

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

/**
 * Stateful previews are the same primitive as the ones above. Under the old
 * model this had to be a `demo` rather than a `variant` purely because it holds
 * a hook.
 */
export const Interactive = createPreview({
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
