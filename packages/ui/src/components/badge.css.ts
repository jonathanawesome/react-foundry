import { recipe, themeContract } from '@react-foundry/style'

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
      danger: { color: '#d93251', backgroundColor: 'rgba(217, 50, 81, 0.1)' },
      warning: { color: '#e56910', backgroundColor: 'rgba(229, 105, 16, 0.1)' },
      caution: { color: '#c29a00', backgroundColor: 'rgba(194, 154, 0, 0.1)' },
      info: { color: '#0077c7', backgroundColor: 'rgba(0, 119, 199, 0.1)' },
      success: { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
      neutral: {
        color: themeContract.colors.neutral7,
        backgroundColor: themeContract.colors.neutral3,
      },
    },
  },

  defaultVariants: {
    tone: 'neutral',
  },
})
