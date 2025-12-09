import { globalStyle } from '@vanilla-extract/css'

import { themeContract } from './theme-contract.css'

// CSS Reset
globalStyle('*, *::before, *::after', {
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
})

globalStyle('html', {
  lineHeight: 1.15,
  WebkitTextSizeAdjust: '100%',
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

globalStyle('h1, h2, h3, h4, h5, h6', {
  fontFamily: themeContract.fonts.sans,
})

globalStyle('button', {
  all: 'unset',
  border: 'none',
  backgroundColor: 'transparent',
  margin: 0,
  padding: 0,
  boxSizing: 'border-box',
})

globalStyle('button::-moz-focus-inner', {
  borderStyle: 'none',
  padding: 0,
})

globalStyle('button:-moz-focusring', {
  outline: '1px dotted ButtonText',
})

globalStyle('input, textarea, select', {
  fontFamily: 'inherit',
  fontSize: '100%',
  lineHeight: 1.15,
  margin: 0,
})

globalStyle(
  'input[type="text"], input[type="email"], input[type="password"], textarea',
  {
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
  }
)

// Focus styles
globalStyle('*:focus-visible', {
  outlineOffset: '2px',
})

globalStyle('*:focus:not(:focus-visible)', {
  outline: 'none',
})

// Smooth scrolling
globalStyle('html', {
  scrollBehavior: 'smooth',
})

// Code styles
globalStyle('code, kbd, samp, pre', {
  fontFamily: themeContract.fonts.mono,
  fontSize: '1em',
})

globalStyle('pre', {
  overflow: 'auto',
})

// Remove default list styles
globalStyle('ul, ol', {
  listStyle: 'none',
})

// Image styles
globalStyle('img', {
  maxWidth: '100%',
  height: 'auto',
})

// Table styles
globalStyle('table', {
  borderCollapse: 'collapse',
  borderSpacing: 0,
})

// Disabled state
globalStyle('[disabled]', {
  cursor: 'not-allowed',
  opacity: 0.5,
})

// Global scrollbar styles for webkit browsers (Chrome, Safari, Edge)
globalStyle('::-webkit-scrollbar', {
  width: themeContract.px[4], // Width of vertical scrollbar
  height: themeContract.px[4], // Height of horizontal scrollbar
})

globalStyle('::-webkit-scrollbar-track', {
  background: 'transparent', // Track background
  borderRadius: themeContract.px[6],
})

globalStyle('::-webkit-scrollbar-thumb', {
  background: themeContract.colors.neutral7, // Scrollbar handle
  borderRadius: themeContract.px[6],
  transition: 'background 0.3s ease',
})

globalStyle('::-webkit-scrollbar-thumb:hover', {
  background: themeContract.colors.neutral6, // Darker on hover
})

globalStyle('::-webkit-scrollbar-corner', {
  background: 'transparent', // Corner where scrollbars meet
})

// For Firefox (uses different syntax)
globalStyle('html', {
  scrollbarWidth: 'thin',
  scrollbarColor: `${themeContract.colors.neutral7} transparent`, // thumb track
})
