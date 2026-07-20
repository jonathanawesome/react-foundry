import { style, themeContract } from '@react-foundry/style'

export const toolbarStyles = {
  // A floating toolbar in the top-left corner: rounded, shadowed, above
  // everything so its shelf-reopen button is always reachable.
  container: style({
    position: 'fixed',
    top: themeContract.px[12],
    left: themeContract.px[12],
    zIndex: 1001,

    display: 'flex',
    alignItems: 'center',
    gap: themeContract.px[8],
    padding: themeContract.px[8],

    background: themeContract.colors.panel,
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: themeContract.radii.large,
    boxShadow: themeContract.shadows.wide,
  }),

  // Divides the shelf/panel controls from the view controls.
  separator: style({
    width: '1px',
    height: themeContract.px[16],
    margin: `0 ${themeContract.px[4]}`,
    background: themeContract.colors.border,
  }),
}
