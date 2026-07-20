import { createGlobalThemeContract } from '@vanilla-extract/css'

import { arrayToKebabString } from './utils'

export const themeContract = createGlobalThemeContract(
  {
    shadows: {
      tight: null,
      wide: null,
    },

    colors: {
      // anchors — the two poles plus accent; every neutral derives from these
      bg: null,
      fg: null,
      accent: null,

      // surfaces
      canvas: null,
      panel: null,

      // border (inputs, dividers, panel edges)
      border: null,

      // text
      textMuted: null,
      textBody: null,
      textStrong: null,

      // hover/active fill (internal; derived, not consumer-overridable)
      stateHover: null,

      // status (internal; fixed, not consumer-overridable)
      statusCritical: null,
      statusSerious: null,
      statusModerate: null,
      statusMinor: null,
      statusSuccess: null,
    },

    // px to rem scaling (pruned to the steps actually used)
    px: {
      1: null,
      2: null,
      4: null,
      6: null,
      8: null,
      12: null,
      14: null,
      16: null,
      18: null,
      20: null,
      24: null,
      32: null,
      40: null,
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

export type ColorToken = keyof typeof themeContract.colors
