import { createPreview } from '@react-foundry/core'
import { useState } from 'react'

import { Button } from './button'

export default createPreview({
  title: 'Button',
  component: Button,
  category: 'UI Components',
  variants: [
    {
      name: 'Primary',
      props: {
        children: 'Primary Button',
        variant: 'primary',
      },
    },
    {
      name: 'Secondary',
      props: {
        children: 'Secondary Button',
        variant: 'secondary',
      },
    },
    {
      name: 'Danger',
      props: {
        children: 'Danger Button',
        variant: 'danger',
      },
    },
    {
      name: 'Small',
      props: {
        children: 'Small Button',
        size: 'small',
      },
    },
    {
      name: 'Large',
      props: {
        children: 'Large Button',
        size: 'large',
      },
    },
    {
      name: 'Disabled',
      props: {
        children: 'Disabled Button',
        disabled: true,
      },
    },
  ],
  demos: [
    {
      name: 'Interactive Example',
      render: () => {
        const [count, setCount] = useState(0)
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <p style={{ marginBottom: '8px' }}>Click count: {count}</p>
              <Button onClick={() => setCount(count + 1)}>
                Increment Counter
              </Button>
            </div>
          </div>
        )
      },
    },
    {
      name: 'All Variants',
      render: () => (
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
      ),
    },
  ],
})
