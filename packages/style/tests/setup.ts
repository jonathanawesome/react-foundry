import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// RTL only auto-registers cleanup with vitest globals enabled; this project
// imports from 'vitest' explicitly, so unmounting is wired up by hand.
afterEach(cleanup)
