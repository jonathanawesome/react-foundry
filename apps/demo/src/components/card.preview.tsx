import { controlsFor, createPreview, type NavPath } from 'react-foundry'

import { Card } from './card'

export const nav: NavPath = 'Demo/Surfaces/Card'

// Every control here is one of Card's three props, and controlsFor is what says so:
// CardProps is hand-written and narrow, so the schema below is the whole component.
// `children` is a ReactNode, which takes a text control because a string is a valid
// ReactNode. That is as far as an input can go; a derive goes further, see Derived.
export const Playground = createPreview({
  controls: controlsFor(Card, {
    children: { type: 'text', default: 'This is a card' },
    padding: { type: 'radio', options: ['small', 'medium', 'large'], default: 'medium' },
    elevated: { type: 'boolean', default: false },
  }),
  render: (v) => (
    <Card padding={v.padding} elevated={v.elevated}>
      {v.children}
    </Card>
  ),
})

// A panel cannot author JSX, but a derive can: the range hands its number to a
// function that builds the paragraphs, and `v.children` arrives as the nodes. The
// key is still checked against Card, only the input type is freed, and the return
// type is checked against the prop, so a derive returning something that is not a
// ReactNode would not compile.
export const Derived = createPreview({
  label: 'Derived Children',
  controls: controlsFor(Card, {
    children: {
      type: 'range',
      min: 1,
      max: 5,
      default: 2,
      derive: (n) =>
        Array.from({ length: n }, (_, i) => (
          <p key={i} style={{ margin: i === 0 ? 0 : '8px 0 0' }}>
            Paragraph {i + 1} of {n}
          </p>
        )),
    },
    elevated: { type: 'boolean', default: false },
  }),
  render: (v) => <Card elevated={v.elevated}>{v.children}</Card>,
})

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
