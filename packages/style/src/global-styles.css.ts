import { globalStyle } from '@vanilla-extract/css'

import { themeContract } from './theme-contract.css'

/**
 * The canvas (marked `data-foundry-canvas`, the element that renders the consumer's
 * preview) must not receive foundry's appearance-changing resets, or components won't
 * render the way they do in the consumer's own app. Element-matched resets below are
 * excluded from the canvas subtree with `:not([data-foundry-canvas] …)`.
 *
 * Inherited typography (the body font/size/color) still reaches the canvas; there is no
 * correct "neutral" value without knowing the consumer's page, so an unstyled component
 * inherits foundry's sans + text color. Components that set their own type are unaffected.
 */
// `:where(...)` inside `:not(...)` contributes ZERO specificity, so each reset keeps its
// original weight. A bare `:not([data-foundry-canvas] …)` would instead add the argument's
// specificity and start overriding the component styles it's meant to sit beneath (e.g.
// `all: unset` beating a shelf button's `display: flex`, which stacked the tree carets).
const chromeOnly = (selectors: string) =>
  selectors
    .split(',')
    .map((s) => {
      const sel = s.trim()
      return `${sel}:not(:where([data-foundry-canvas] ${sel}))`
    })
    .join(', ')

// ── Truly global, harmless normalization ──────────────────────────────────────

globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
})

globalStyle('html', {
  lineHeight: 1.15,
  WebkitTextSizeAdjust: '100%',
  scrollBehavior: 'smooth',
})

globalStyle('body', {
  margin: 0,
  fontFamily: themeContract.fonts.sans,
  fontSize: themeContract.px[14],
  color: themeContract.colors.neutral7,
  backgroundColor: themeContract.colors.neutral3,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
})

globalStyle('main', {
  display: 'block',
})

globalStyle('pre', {
  overflow: 'auto',
})

globalStyle('*:focus-visible', {
  outlineOffset: '2px',
})

// ── Chrome-only appearance resets (never reach the canvas) ─────────────────────

globalStyle(chromeOnly('*'), {
  margin: 0,
  padding: 0,
})

globalStyle(chromeOnly('h1, h2, h3, h4, h5, h6'), {
  fontFamily: themeContract.fonts.sans,
})

globalStyle(chromeOnly('button'), {
  all: 'unset',
  border: 'none',
  backgroundColor: 'transparent',
  margin: 0,
  padding: 0,
  boxSizing: 'border-box',
})

globalStyle(chromeOnly('button::-moz-focus-inner'), {
  borderStyle: 'none',
  padding: 0,
})

globalStyle(chromeOnly('button:-moz-focusring'), {
  outline: '1px dotted ButtonText',
})

globalStyle(chromeOnly('input, textarea, select'), {
  fontFamily: 'inherit',
  fontSize: '100%',
  lineHeight: 1.15,
  margin: 0,
})

globalStyle(
  chromeOnly('input[type="text"], input[type="email"], input[type="password"], textarea'),
  {
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
  }
)

globalStyle(chromeOnly('*:focus:not(:focus-visible)'), {
  outline: 'none',
})

globalStyle(chromeOnly('code, kbd, samp, pre'), {
  fontFamily: themeContract.fonts.mono,
  fontSize: '1em',
})

globalStyle(chromeOnly('ul, ol'), {
  listStyle: 'none',
})

globalStyle(chromeOnly('img'), {
  maxWidth: '100%',
  height: 'auto',
})

globalStyle(chromeOnly('table'), {
  borderCollapse: 'collapse',
  borderSpacing: 0,
})

globalStyle(chromeOnly('[disabled]'), {
  cursor: 'not-allowed',
  opacity: 0.5,
})

// ── Global scrollbar styling (chrome-level; fine on the canvas scroll too) ─────

globalStyle('::-webkit-scrollbar', {
  width: themeContract.px[4],
  height: themeContract.px[4],
})

globalStyle('::-webkit-scrollbar-track', {
  background: 'transparent',
  borderRadius: themeContract.px[6],
})

globalStyle('::-webkit-scrollbar-thumb', {
  background: themeContract.colors.neutral7,
  borderRadius: themeContract.px[6],
  transition: 'background 0.3s ease',
})

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: themeContract.colors.neutral6,
})

globalStyle('::-webkit-scrollbar-corner', {
  background: 'transparent',
})

globalStyle('html', {
  scrollbarWidth: 'thin',
  scrollbarColor: `${themeContract.colors.neutral7} transparent`,
})
