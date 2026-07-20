import { Icon, type IconName } from '@react-foundry/ui'
import { createPreview, type NavPath } from 'react-foundry'

export const nav: NavPath = 'Dogfood/Icon'

const names: IconName[] = [
  'CaretRight',
  'Circle',
  'Notebook',
  'Moon',
  'PushPin',
  'Sliders',
  'Sun',
  'Wheelchair',
]

export const AllIcons = createPreview({
  label: 'Every Icon',
  render: () => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
        gap: 16,
        maxWidth: 480,
      }}
    >
      {names.map((name) => (
        <div
          key={name}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
            color: '#888',
          }}
        >
          <Icon name={name} size="md" />
          {name}
        </div>
      ))}
    </div>
  ),
})

export const Sizes = createPreview(() => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
    <Icon name="Notebook" size="sm" />
    <Icon name="Notebook" size="md" />
  </div>
))

export const Rotated = createPreview(() => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
    <Icon name="CaretRight" />
    <Icon name="CaretRight" rotate="90" />
    <Icon name="CaretRight" rotate="180" />
    <Icon name="CaretRight" rotate="270" />
  </div>
))
