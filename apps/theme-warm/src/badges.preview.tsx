import { Badge, type BadgeTone } from '@react-foundry/ui'
import { createPreview } from 'react-foundry'

import type { WarmNavPath } from '../foundry.config'

// The codegen-free union, derived from the config's own tree by `NavPathsOf` rather than
// read off a generated `foundry-nav.gen.d.ts`. Typos are still compile errors.
export const nav: WarmNavPath = 'Components/Badges'

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
