import { style, themeContract } from '@react-foundry/style'

export const listFieldStyles = {
  // The list is a section like a group: a fieldset for the semantics, with the UA
  // styles (min-inline-size, border, padding) overridden the same way.
  list: style({
    display: 'flex',
    flexDirection: 'column',
    gap: themeContract.px[12],
    minInlineSize: 0,
    margin: 0,
    padding: themeContract.px[12],
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: themeContract.radii.medium,
  }),

  label: style({
    padding: `0 ${themeContract.px[4]}`,
    fontFamily: themeContract.fonts.sans,
    fontSize: themeContract.px[12],
    fontWeight: 600,
    color: themeContract.colors.textMuted,
  }),

  // A row of a group schema: its own fieldset, one step tighter than the list.
  // Relative so the remove button can sit in its top corner, clear of the legend.
  row: style({
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: themeContract.px[8],
    minInlineSize: 0,
    margin: 0,
    padding: themeContract.px[8],
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: themeContract.radii.small,
  }),

  rowLabel: style({
    padding: `0 ${themeContract.px[4]}`,
    fontFamily: themeContract.fonts.sans,
    fontSize: themeContract.px[12],
    fontWeight: 600,
    color: themeContract.colors.textMuted,
  }),

  remove: style({
    position: 'absolute',
    top: themeContract.px[4],
    right: themeContract.px[4],
  }),

  // A row of a scalar schema: the one field, with the remove button beside it,
  // aligned to the input rather than the label above it.
  scalarRow: style({
    display: 'flex',
    alignItems: 'flex-end',
    gap: themeContract.px[8],
  }),

  scalarField: style({
    flex: 1,
    minWidth: 0,
  }),

  // Chrome buttons start from `all: unset`, so everything visible is set here.
  add: style({
    display: 'inline-flex',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: themeContract.px[6],
    padding: `${themeContract.px[4]} ${themeContract.px[8]}`,
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: themeContract.radii.small,
    fontFamily: themeContract.fonts.sans,
    fontSize: themeContract.px[12],
    fontWeight: 500,
    color: themeContract.colors.textStrong,
    cursor: 'pointer',
    ':hover': {
      background: themeContract.colors.stateHover,
    },
  }),
}
