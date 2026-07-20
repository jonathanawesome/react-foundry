import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Standalone `act` from 'react' warns unless this global is set; RTL sets it for its own
// render, but not for the bare `act` the theme-provider test uses to drive updates.
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

// RTL only auto-registers cleanup with vitest globals enabled; this project
// imports from 'vitest' explicitly, so unmounting is wired up by hand.
afterEach(cleanup)
