import { colorWithAlpha, recipe, themeContract } from '@react-foundry/style'

const c = themeContract.colors

export const badgeStyles = recipe({
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: themeContract.px[4],
    padding: `${themeContract.px[2]} ${themeContract.px[8]}`,
    borderRadius: themeContract.radii.large,
    fontSize: themeContract.px[12],
    fontWeight: 500,
    fontFamily: themeContract.fonts.sans,
    whiteSpace: 'nowrap',
  },

  variants: {
    tone: {
      danger: {
        color: c.statusCritical,
        backgroundColor: colorWithAlpha(c.statusCritical, 0.1),
      },
      warning: {
        color: c.statusSerious,
        backgroundColor: colorWithAlpha(c.statusSerious, 0.1),
      },
      caution: {
        color: c.statusModerate,
        backgroundColor: colorWithAlpha(c.statusModerate, 0.1),
      },
      info: {
        color: c.statusMinor,
        backgroundColor: colorWithAlpha(c.statusMinor, 0.1),
      },
      success: {
        color: c.statusSuccess,
        backgroundColor: colorWithAlpha(c.statusSuccess, 0.1),
      },
      neutral: {
        color: themeContract.colors.textBody,
        backgroundColor: themeContract.colors.stateHover,
      },
    },
  },

  defaultVariants: {
    tone: 'neutral',
  },
})
