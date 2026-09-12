import { colorWithAlpha, style, themeContract } from '@react-foundry/style'

/**
 * `top`/`left` stay at 0 on purpose: the component writes the measured rect to
 * `transform` and the size instead. `zIndex` sits below the a11y panel (1000) and the
 * toolbar (1001), since the outline points at the canvas and should never cover
 * foundry's own chrome.
 */
export const highlightOverlayStyles = style({
  position: 'fixed',
  top: 0,
  left: 0,
  zIndex: 999,
  pointerEvents: 'none',

  // A border rather than an outline: the component clips itself to the canvas with
  // `clip-path`, which clips to the border box, and an outline paints outside that box so
  // it would be cut away even when the target is fully visible. `border` keeps the dashed
  // and solid states that `box-shadow` could not express.
  boxSizing: 'border-box',
  borderRadius: themeContract.radii.small,
  border: `2px dashed ${themeContract.colors.accent}`,
  backgroundColor: colorWithAlpha(themeContract.colors.accent, 0.08),

  selectors: {
    // Pinned is the committed state, hover is a preview, so pinned reads louder.
    '&[data-pinned="true"]': {
      borderStyle: 'solid',
      backgroundColor: colorWithAlpha(themeContract.colors.accent, 0.16),
    },
  },
})
