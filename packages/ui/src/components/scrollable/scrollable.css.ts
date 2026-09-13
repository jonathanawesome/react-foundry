import { style, themeContract } from '@react-foundry/style'

/**
 * A styled scroll container. The scrollbar rules are scoped to this class
 * (`.scrollable::-webkit-scrollbar`, and the inheritable Firefox `scrollbarColor`),
 * so foundry's scrollbar styling reaches only its own scroll regions, never the
 * consumer's component on the canvas. A bare global `::-webkit-scrollbar` cannot make
 * that distinction, and `scrollbarColor` on `html`/`body` would inherit into the canvas.
 */
export const scrollable = style({
  overflow: 'auto',
  scrollbarWidth: 'thin',
  scrollbarColor: `${themeContract.colors.border} transparent`,

  selectors: {
    '&::-webkit-scrollbar': {
      width: themeContract.px[4],
      height: themeContract.px[4],
    },
    '&::-webkit-scrollbar-track': {
      background: 'transparent',
      borderRadius: themeContract.px[6],
    },
    '&::-webkit-scrollbar-thumb': {
      background: themeContract.colors.border,
      borderRadius: themeContract.px[6],
      transition: 'background 0.3s ease',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      background: themeContract.colors.textMuted,
    },
    '&::-webkit-scrollbar-corner': {
      background: 'transparent',
    },
  },
})
