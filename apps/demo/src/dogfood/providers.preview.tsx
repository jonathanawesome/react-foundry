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
    const { name, accent } = useBrand()

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
        {name} action
      </button>
    )
  },
})
