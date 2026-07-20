import { globalFontFace } from '@vanilla-extract/css'

// Instrument Sans Variable Font
globalFontFace('InstrumentSans', {
  src: 'url("./assets/fonts/instrument-sans-variable.woff2") format("woff2-variations")',
  fontWeight: '100 900',
  fontStyle: 'normal',
  fontDisplay: 'swap',
})
