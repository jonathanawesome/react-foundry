import { Badge, type BadgeTone } from '@react-foundry/ui'
import { createPreview, type NavPath } from 'react-foundry'

export const nav: NavPath = 'Components/Badges'

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
