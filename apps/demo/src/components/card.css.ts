import { recipe, themeContract } from '@react-foundry/style'

export const cardStyles = recipe({
  base: {
    backgroundColor: themeContract.colors.neutral2,
    borderRadius: themeContract.radii.medium,
    border: `1px solid ${themeContract.colors.neutral4}`,
  },

  variants: {
    padding: {
      small: {
        padding: themeContract.px[12],
      },
      medium: {
        padding: themeContract.px[16],
      },
      large: {
        padding: themeContract.px[24],
      },
    },
    elevated: {
      true: {
        boxShadow: themeContract.shadows.wide,
        border: 'none',
      },
      false: {},
    },
  },
})
