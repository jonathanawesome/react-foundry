import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// RTL only auto-registers cleanup when vitest globals are enabled; this project imports
// from 'vitest' explicitly, so unmounting has to be wired up by hand.
afterEach(cleanup)

// jsdom implements no layout, so neither of these exists in it. Stubbed here rather than
// guarded in the components, which run in browsers where both do.
Element.prototype.scrollTo = () => {}
globalThis.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver
