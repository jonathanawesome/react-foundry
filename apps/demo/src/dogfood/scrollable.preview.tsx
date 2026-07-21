import { Scrollable } from '@react-foundry/ui'
import { createPreview, type NavPath } from 'react-foundry'

export const nav: NavPath = 'Dogfood/Scrollable'

const box = {
  border: '1px solid rgba(128, 128, 128, 0.3)',
  borderRadius: 8,
  padding: 12,
  width: 260,
}

export const Vertical = createPreview({
  label: 'Vertical Scroll',
  render: () => (
    <Scrollable style={{ ...box, height: 160 }}>
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
    <Scrollable style={box}>
      <div style={{ whiteSpace: 'nowrap', fontFamily: 'monospace' }}>
        {'main > section > article > div > ul > li > a > span > code > em > strong'}
      </div>
    </Scrollable>
  ),
})

export const BothAxes = createPreview({
  label: 'Both Axes',
  render: () => (
    <Scrollable style={{ ...box, height: 160 }}>
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
