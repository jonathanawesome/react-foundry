import { style, themeContract } from '@react-foundry/style'

export const propInfoStyles = {
  // The signature reads as code and wraps at the bubble's edge rather than
  // running off it, since a union of options can be long.
  signature: style({
    fontFamily: themeContract.fonts.mono,
    fontSize: themeContract.px[12],
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    color: themeContract.colors.textStrong,
  }),
}
