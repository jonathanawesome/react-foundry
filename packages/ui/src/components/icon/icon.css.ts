import { recipe, themeContract } from '@react-foundry/style'

export const iconClass = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: themeContract.colors.textMuted,
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
