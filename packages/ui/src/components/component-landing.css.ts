import { style, themeContract } from '@react-foundry/style'

export const componentLandingStyles = {
  container: style({
    padding: themeContract.px[32],
    maxWidth: '800px',
    margin: '0 auto',
  }),

  title: style({
    color: themeContract.colors.neutral8,
    marginBottom: themeContract.px[8],
  }),

  sourcePath: style({
    fontFamily: themeContract.fonts.mono,
    fontSize: themeContract.px[12],
    color: themeContract.colors.neutral6,
    marginBottom: themeContract.px[32],
  }),

  emptyState: style({
    color: themeContract.colors.neutral6,
    fontStyle: 'italic',
  }),

  section: style({
    marginBottom: themeContract.px[32],
  }),

  sectionTitle: style({
    fontSize: themeContract.px[24],
    color: themeContract.colors.neutral8,
    marginBottom: themeContract.px[16],
  }),

  list: style({
    listStyle: 'none',
    padding: 0,
  }),

  listItem: style({
    marginBottom: themeContract.px[8],
  }),

  itemLink: style({
    display: 'block',
    padding: `${themeContract.px[12]} ${themeContract.px[16]}`,
    background: themeContract.colors.neutral3,
    borderRadius: themeContract.radii.medium,
    textDecoration: 'none',
    color: themeContract.colors.neutral7,
    transition: `background-color 0.2s ${themeContract.motion.authentic}`,

    ':hover': {
      background: themeContract.colors.neutral4,
      color: themeContract.colors.neutral8,
    },
  }),

  notFound: style({
    padding: themeContract.px[32],
    color: themeContract.colors.neutral7,
  }),
}
