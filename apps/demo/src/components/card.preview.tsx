import { createPreview } from '@react-foundry/core'

import { Card } from './card'

export default createPreview({
  title: 'Card',
  component: Card,
  category: 'UI Components',
  variants: [
    {
      name: 'Default',
      props: {
        children: 'This is a card with default padding',
      },
    },
    {
      name: 'Small Padding',
      props: {
        children: 'This is a card with small padding',
        padding: 'small',
      },
    },
    {
      name: 'Large Padding',
      props: {
        children: 'This is a card with large padding',
        padding: 'large',
      },
    },
    {
      name: 'Elevated',
      props: {
        children: 'This is an elevated card with a shadow',
        elevated: true,
      },
    },
  ],
  demos: [
    {
      name: 'Content Example',
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Card>
            <h3 style={{ marginBottom: '8px' }}>Card Title</h3>
            <p>
              This is a card with some content. Cards are great for grouping
              related information together.
            </p>
          </Card>
          <Card elevated>
            <h3 style={{ marginBottom: '8px' }}>Elevated Card</h3>
            <p>
              This card is elevated with a shadow, making it stand out from the
              background.
            </p>
          </Card>
        </div>
      ),
    },
  ],
})
