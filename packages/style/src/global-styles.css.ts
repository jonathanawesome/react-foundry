import { globalStyle, style } from '@vanilla-extract/css'

import { themeContract } from './theme-contract.css'

/**
 * The canvas (marked `data-foundry-canvas`, the element that renders the consumer's
 * preview) must receive nothing from foundry, so a component renders exactly as it does
 * in the consumer's own app. Foundry's styling is confined to its chrome two ways:
 *
 *   - Element-matched resets are excluded from the canvas subtree with
 *     `:not([data-foundry-canvas] …)` via {@link chromeOnly}.
 *   - Inherited typography (font, size, line-height, color) is never set on `body`/`html`,
 *     which are canvas ancestors the component would inherit them from. It is anchored on
 *     each chrome surface via {@link chromeSurface} instead, leaving the canvas to inherit
 *     only the consumer's document (or, unstyled, the UA default).
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

/**
 * Foundry's base typography, composed onto each chrome surface root rather than set on
 * `body`/`html`. Chrome must anchor its own type: `body` and `html` are ancestors of the
 * canvas, so anything set there would be inherited by the consumer's component. Anchoring
 * per-surface keeps foundry's type on foundry's UI while the canvas inherits only the
 * consumer's document (or the UA default), so the isolation is total in both directions.
 */
export const chromeSurface = style({
  fontFamily: themeContract.fonts.sans,
  fontSize: themeContract.px[14],
  lineHeight: 1.15,
  color: themeContract.colors.textBody,
  WebkitFontSmoothing: 'antialiased',
  MozOsxFontSmoothing: 'grayscale',
})

// ── Page-level rules that never reach the canvas ───────────────────────────────
// Only non-inherited, non-appearance properties live at the document level. Anything
// the consumer's component could inherit (typography, color) is anchored on chrome
// surfaces via `chromeSurface` instead, so the canvas is left to the consumer's document.

globalStyle('html', {
  scrollBehavior: 'smooth',
})

globalStyle('body', {
  margin: 0,
  backgroundColor: themeContract.colors.canvas,
})

// ── Chrome-only resets (never reach the canvas) ────────────────────────────────

globalStyle(chromeOnly('*, *::before, *::after'), {
  boxSizing: 'border-box',
})

globalStyle(chromeOnly('main'), {
  display: 'block',
})

globalStyle(chromeOnly('pre'), {
  overflow: 'auto',
})

globalStyle(chromeOnly('*:focus-visible'), {
  outlineOffset: '2px',
})

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

// Scrollbar styling is intentionally not global: it lives on the `Scrollable` component
// (packages/ui) so it scopes to foundry's own scroll containers and never the canvas.
