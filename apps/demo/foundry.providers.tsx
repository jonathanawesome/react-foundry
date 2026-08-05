import type { FoundryProvider } from 'react-foundry'

import { BrandProvider } from './src/dogfood/brand'

// A consumer's global stylesheet, which is how one reaches foundry's document at all.
// See the file: it is a tripwire for foundry's chrome painting over the app shell.
import './src/dogfood/consumer-shell.css'

// Foundry wraps every preview in this, the same way a component is wrapped in the real
// app. The accent is chosen from foundry's resolved theme, so a preview that reads the
// brand tracks foundry's own light/dark toggle.
export const Provider: FoundryProvider = ({ children, theme }) => (
  <BrandProvider
    accent={theme === 'dark' ? 'mediumspringgreen' : 'sandybrown'}
    mode={theme}
  >
    {children}
  </BrandProvider>
)
