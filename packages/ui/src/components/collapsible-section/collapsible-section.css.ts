import { recipe, style, themeContract } from '@react-foundry/style'

/**
 * The legend's height, pinned so the border line has a known position: a
 * fieldset draws its top border through the vertical middle of the legend, and
 * its padding box, which the header cluster is positioned against, starts at the
 * legend's bottom. So the line sits half a legend above that box.
 */
const LEGEND_HEIGHT = themeContract.px[16]

/** The header cluster's height: the small icon button. */
const HEADER_HEIGHT = themeContract.px[20]

/** Lifts the cluster so its middle lands on the border line, as the legend's does. */
const HEADER_RISE = `calc(-1 * (${LEGEND_HEIGHT} / 2 + ${HEADER_HEIGHT} / 2))`

export const collapsibleSectionStyles = {
  // A fieldset for the grouping semantics; its UA styles (min-inline-size, default
  // border and padding) are all overridden here. Relative so the header cluster can
  // sit in the border line, and no gap of its own: the content wrapper carries it,
  // so a collapsed section is just its border with the label and controls on it.
  section: recipe({
    base: {
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      minInlineSize: 0,
      margin: 0,
      border: `1px solid ${themeContract.colors.border}`,
      borderRadius: themeContract.radii.medium,
      padding: themeContract.px[12],
      selectors: {
        '&[data-open="false"]': {
          paddingBlock: 0,
          paddingBottom: themeContract.px[4],
          border: 0,
          borderTop: `1px solid ${themeContract.colors.border}`,
        },
      },
    },
    variants: {
      tight: {
        true: {
          borderRadius: themeContract.radii.small,
          padding: themeContract.px[8],
        },
      },
    },
  }),

  label: style({
    padding: `0 ${themeContract.px[4]}`,
    fontFamily: themeContract.fonts.sans,
    fontSize: themeContract.px[12],
    lineHeight: LEGEND_HEIGHT,
    fontWeight: 600,
    color: themeContract.colors.textMuted,
  }),

  // The right-hand counterpart of the legend: any actions, then the caret, on the
  // border line. The panel's background behind it breaks the line the way the
  // legend's notch does on the left.
  header: style({
    position: 'absolute',
    top: HEADER_RISE,
    right: themeContract.px[8],
    display: 'flex',
    alignItems: 'center',
    height: HEADER_HEIGHT,
    gap: themeContract.px[2],
    padding: `0 ${themeContract.px[2]}`,
    background: themeContract.colors.panel,
  }),

  content: recipe({
    base: {
      display: 'flex',
      flexDirection: 'column',
      gap: themeContract.px[12],
    },
    variants: {
      tight: {
        true: {
          gap: themeContract.px[8],
        },
      },
    },
  }),
}
