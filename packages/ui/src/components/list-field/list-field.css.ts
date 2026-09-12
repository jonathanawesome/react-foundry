import { style, themeContract } from '@react-foundry/style'

export const listFieldStyles = {
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
