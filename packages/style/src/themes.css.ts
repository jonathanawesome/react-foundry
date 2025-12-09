import { createTheme } from '@vanilla-extract/css'

import { themeContract } from './theme-contract.css'
import { transformColors } from './utils'

const colorTokens = {
  dark: {
    neutral1: '14.6% 0 0',
    neutral2: '17.4% 0 0',
    neutral3: '21.6% 0 0',
    neutral4: '23.8% 0 0',
    neutral5: '30.1% 0 0',
    neutral6: '62.5% 0 0',
    neutral7: '90% 0.002575 15.9',
    neutral8: '97.7% 0 0',
    brand: '62.1% 0.289482 350.9',
  },
  light: {
    neutral1: '98.5% 0 0',
    neutral2: '97% 0 0',
    neutral3: '94.7% 0 0',
    neutral4: '91.6% 0 0',
    neutral5: '86.5% 0 0',
    neutral6: '52.8% 0 0',
    neutral7: '34.1% 0 0',
    neutral8: '11.6% 0 0',
    brand: '62.1% 0.289482 350.9',
  },
}

const colors = {
  dark: {
    neutral1: colorTokens.dark.neutral1,
    neutral2: colorTokens.dark.neutral2,
    neutral3: colorTokens.dark.neutral3,
    neutral4: colorTokens.dark.neutral4,
    neutral5: colorTokens.dark.neutral5,
    neutral6: colorTokens.dark.neutral6,
    neutral7: colorTokens.dark.neutral7,
    neutral8: colorTokens.dark.neutral8,

    brand: colorTokens.dark.brand,
  },
  light: {
    neutral1: colorTokens.light.neutral1,
    neutral2: colorTokens.light.neutral2,
    neutral3: colorTokens.light.neutral3,
    neutral4: colorTokens.light.neutral4,
    neutral5: colorTokens.light.neutral5,
    neutral6: colorTokens.light.neutral6,
    neutral7: colorTokens.light.neutral7,
    neutral8: colorTokens.light.neutral8,
    brand: colorTokens.light.brand,
  },
}

// Shared tokens that don't change between themes
const sharedTokens = {
  px: {
    1: '0.0625rem',
    2: '0.125rem',
    3: '0.1875rem',
    4: '0.25rem',
    5: '0.3125rem',
    6: '0.375rem',
    7: '0.4375rem',
    8: '0.5rem',
    9: '0.5625rem',
    10: '0.625rem',
    11: '0.6875rem',
    12: '0.75rem',
    13: '0.8125rem',
    14: '0.875rem',
    15: '0.9375rem',
    16: '1rem',
    17: '1.0625rem',
    18: '1.125rem',
    19: '1.1875rem',
    20: '1.25rem',
    24: '1.5rem',
    32: '2rem',
    40: '2.5rem',
    60: '3.75rem',
    64: '4rem',
  },

  radii: {
    small: '0.125rem',
    medium: '0.25rem',
    large: '0.375rem',
  },

  fonts: {
    sans: '"InstrumentSans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "JetBrains Mono", Consolas, monospace',
  },

  motion: {
    authentic: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export const darkTheme = createTheme(themeContract, {
  colors: transformColors(colors.dark),

  ...sharedTokens,

  shadows: {
    tight: `oklch(${colors.dark.neutral5} / 0.45) 0px 1px 5px 1px`,
    wide: `oklch(${colors.dark.neutral5} / 0.35) 0px 10px 38px -10px, oklch(${colors.dark.neutral5} / 0.2) 0px 10px 20px -15px`,
  },
})

export const lightTheme = createTheme(themeContract, {
  colors: transformColors(colors.light),

  ...sharedTokens,

  shadows: {
    tight: `oklch(${colors.light.neutral5} / 0.75) 0px 1px 5px 1px`,
    wide: `oklch(${colors.light.neutral7} / 0.35) 0px 10px 38px -10px, oklch(${colors.light.neutral7} / 0.2) 0px 10px 20px -15px`,
  },
})
