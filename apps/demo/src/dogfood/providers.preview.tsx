import { createPreview, type NavPath } from 'react-foundry'

import { useBrand } from './brand'

export const nav: NavPath = 'Dogfood/Providers'

// Styled entirely by context it never receives as a prop, supplied by the demo's
// foundry.providers.tsx. The accent tracks foundry's light/dark toggle, and the preview
// throws if the provider is removed, which is exactly how a real design-system component
// behaves. This is what a global Provider buys you: previewing components that cannot
// render outside their app context.
export const BrandedButton = createPreview({
  label: 'Consumes Brand Context',
  render: () => {
    const { accent } = useBrand()

    return (
      <button
        type="button"
        style={{
          background: accent,
          color: 'white',
          border: 'none',
          borderRadius: 6,
          padding: '8px 16px',
          font: 'inherit',
          cursor: 'pointer',
        }}
      >
        Toggle Foundry theme to see accent overrides
      </button>
    )
  },
})

// Reads the resolved theme foundry supplies to the provider and prints it as text, so
// flipping foundry's light/dark toggle flips this readout from "light" to "dark". Like
// the button above, the preview never receives the mode as a prop; it comes entirely
// from the provider context foundry wraps around every preview.
export const ThemeReadout = createPreview({
  label: 'Reads Resolved Theme',
  render: () => {
    const { mode } = useBrand()

    return (
      <p style={{ font: 'inherit', margin: 0 }}>
        Current theme: <strong>{mode}</strong>
      </p>
    )
  },
})
