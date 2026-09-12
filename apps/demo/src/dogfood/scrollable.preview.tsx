import { Scrollable } from '@react-foundry/ui'
import { createPreview, type NavPath } from 'react-foundry'

import { tall, viewport } from './scrollable.css'

export const nav: NavPath = 'Dogfood/Scrollable'

// Sizing goes through `className`: Scrollable takes no style of its own, so the
// caller's layout composes after the scroll behaviour rather than around it.
export const Vertical = createPreview({
  label: 'Vertical Scroll',
  render: () => (
    <Scrollable className={`${viewport} ${tall}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: 20 }, (_, i) => (
          <div key={i}>Row {i + 1}</div>
        ))}
      </div>
    </Scrollable>
  ),
})

export const Horizontal = createPreview({
  label: 'Horizontal Scroll',
  render: () => (
    <Scrollable className={viewport}>
      <div style={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
        {'main > section > article > div > ul > li > a > span > code > em > strong'}
      </div>
    </Scrollable>
  ),
})

export const BothAxes = createPreview({
  label: 'Both Axes',
  render: () => (
    <Scrollable className={`${viewport} ${tall}`}>
      <div
        style={{
          width: 600,
          height: 400,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        600 × 400 content in a 260 × 160 viewport
      </div>
    </Scrollable>
  ),
})
