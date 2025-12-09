import { createGlobalThemeContract } from '@vanilla-extract/css'

import { arrayToKebabString } from './utils'

export const themeContract = createGlobalThemeContract(
  {
    shadows: {
      tight: null,
      wide: null,
    },

    colors: {
      // neutral scale
      neutral1: null,
      neutral2: null,
      neutral3: null,
      neutral4: null,
      neutral5: null,
      neutral6: null,
      neutral7: null,
      neutral8: null,

      // brand
      brand: null,
    },

    // px to rem scaling
    px: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
      10: null,
      11: null,
      12: null,
      13: null,
      14: null,
      15: null,
      16: null,
      17: null,
      18: null,
      19: null,
      20: null,
      24: null,
      32: null,
      40: null,
      60: null,
      64: null,
    },

    radii: {
      small: null,
      medium: null,
      large: null,
    },

    fonts: {
      sans: null,
      mono: null,
    },

    // motion!
    motion: {
      authentic: null,
    },
  },
  (_value, path) => `foundry${arrayToKebabString(path)}`
)
