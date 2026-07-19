import { createPreview, type NavPath } from '@react-foundry/core'

import { Card } from './card'

export const nav: NavPath = 'Components/Surfaces'

export const Default = createPreview(() => (
  <Card>This is a card with default padding</Card>
))

export const SmallPadding = createPreview(() => (
  <Card padding="small">This is a card with small padding</Card>
))

export const LargePadding = createPreview(() => (
  <Card padding="large">This is a card with large padding</Card>
))

export const Elevated = createPreview(() => (
  <Card elevated>This is an elevated card with a shadow</Card>
))

export const ContentExample = createPreview(() => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
    <Card>
      <h3 style={{ marginBottom: '8px' }}>Card Title</h3>
      <p>
        This is a card with some content. Cards are great for grouping related information
        together.
      </p>
    </Card>
    <Card elevated>
      <h3 style={{ marginBottom: '8px' }}>Elevated Card</h3>
      <p>This card is elevated with a shadow, making it stand out from the background.</p>
    </Card>
  </div>
))
