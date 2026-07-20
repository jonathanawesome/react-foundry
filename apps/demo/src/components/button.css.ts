import { recipe, themeContract } from '@react-foundry/style'

export const buttonStyles = recipe({
  base: {
    padding: `${themeContract.px[8]} ${themeContract.px[16]}`,
    borderRadius: themeContract.radii.medium,
    border: 'none',
    cursor: 'pointer',
    fontWeight: 500,
    transition: `all 0.2s ${themeContract.motion.authentic}`,
    fontFamily: themeContract.fonts.sans,

    ':hover': {
      transform: 'translateY(-1px)',
    },

    ':active': {
      transform: 'translateY(0)',
    },

    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      transform: 'none',
    },
  },

  variants: {
    variant: {
      primary: {
        backgroundColor: themeContract.colors.accent,
        color: themeContract.colors.panel,
      },
      secondary: {
        backgroundColor: themeContract.colors.border,
        color: themeContract.colors.textStrong,
      },
      danger: {
        backgroundColor: '#d93251',
        color: themeContract.colors.panel,
      },
    },
    size: {
      small: {
        fontSize: themeContract.px[12],
        padding: `${themeContract.px[4]} ${themeContract.px[12]}`,
      },
      medium: {
        fontSize: themeContract.px[14],
        padding: `${themeContract.px[8]} ${themeContract.px[16]}`,
      },
      large: {
        fontSize: themeContract.px[16],
        padding: `${themeContract.px[12]} ${themeContract.px[24]}`,
      },
    },
  },
})
