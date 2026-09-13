import { createVar, fallbackVar, recipe, themeContract } from '@react-foundry/style'

// The svg fills with currentColor, so this is the one knob a parent needs to recolor an
// icon. Set it on a wrapper (hover, active) rather than relying on `color` inheritance,
// which the base below deliberately interrupts with its muted default.
export const iconColor = createVar()

export const iconClass = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: fallbackVar(iconColor, themeContract.colors.textMuted),
    transform: 'rotate(0deg)',
    transition: `all .15s ${themeContract.motion.authentic}`,
  },

  variants: {
    rotate: {
      '90': {
        transform: 'rotate(90deg)',
      },
      '180': {
        transform: 'rotate(180deg)',
      },
      '270': {
        transform: 'rotate(270deg)',
      },
    },
    size: {
      sm: {
        height: themeContract.px[12],
        width: themeContract.px[12],
      },
      md: {
        height: themeContract.px[16],
        width: themeContract.px[16],
      },
    },
  },
})
