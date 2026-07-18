import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// RTL only auto-registers cleanup when vitest globals are enabled; this project imports
// from 'vitest' explicitly, so unmounting has to be wired up by hand.
afterEach(cleanup)
