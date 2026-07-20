import { Badge, type BadgeTone } from '@react-foundry/ui'
import { createPreview, type NavPath } from 'react-foundry'

export const nav: NavPath = 'Dogfood/Badge'

const tones: BadgeTone[] = ['danger', 'warning', 'caution', 'info', 'success', 'neutral']

export const AllTones = createPreview({
  label: 'Every Tone',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {tones.map((tone) => (
        <Badge key={tone} tone={tone}>
          {tone}
        </Badge>
      ))}
    </div>
  ),
})

// How the accessibility checker uses it: impact levels and a count.
export const AsImpactLevels = createPreview({
  label: 'Impact Levels',
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      <Badge tone="danger">critical</Badge>
      <Badge tone="warning">serious</Badge>
      <Badge tone="caution">moderate</Badge>
      <Badge tone="info">minor</Badge>
      <Badge tone="success">passed</Badge>
    </div>
  ),
})
