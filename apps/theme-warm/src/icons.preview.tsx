import { Icon, type IconName } from '@react-foundry/ui'
import { createPreview } from 'react-foundry'

import type { WarmNavPath } from '../foundry.config'

export const nav: WarmNavPath = 'Components/Icons'

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
          // No fixed color: inherit foundry's recomputed warm text color.
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            fontSize: 12,
          }}
        >
          <Icon name={name} size="md" />
          {name}
        </div>
      ))}
    </div>
  ),
})
