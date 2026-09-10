import { style, themeContract } from '@react-foundry/style'

export const tooltipStyles = {
  // Only ever wraps a single control, so it sizes to it and gives the bubble
  // something to position against.
  wrapper: style({
    position: 'relative',
    display: 'inline-flex',
  }),

  // Placement is set inline, from measurements. Deliberately no `top`/`left`
  // here: an offset written in both places would be one the JS could disagree
  // with, and the JS is the half that has to do the arithmetic.
  bubble: style({
    position: 'absolute',
    // The toolbar container is the stacking context; this only has to clear the
    // buttons rendered after it.
    zIndex: 1,

    display: 'flex',
    alignItems: 'center',
    gap: themeContract.px[6],
    padding: `${themeContract.px[4]} ${themeContract.px[8]}`,

    background: themeContract.colors.panel,
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: themeContract.radii.medium,
    boxShadow: themeContract.shadows.tight,

    color: themeContract.colors.textBody,
    fontSize: themeContract.px[12],
    lineHeight: themeContract.px[16],
    whiteSpace: 'nowrap',

    // The bubble sits directly under the button it describes; without this it
    // would steal the pointer and flicker the tooltip off and on.
    pointerEvents: 'none',
  }),

  // Carries the shortcut to a screen reader, which cannot read a key cap.
  // Clipped rather than `display: none` or `hidden`, both of which drop the
  // element out of the accessibility tree entirely, taking the description with
  // them.
  screenReaderOnly: style({
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0,
  }),

  label: style({
    // Explicit rather than an anonymous flex item, so the bubble's gap applies
    // between the words and the key cap the same way it would between elements.
    display: 'inline-block',
  }),

  // A key cap for the shortcut letter.
  shortcut: style({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: themeContract.px[16],
    padding: `0 ${themeContract.px[4]}`,

    background: themeContract.colors.stateHover,
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: themeContract.radii.small,

    color: themeContract.colors.textStrong,
    fontFamily: themeContract.fonts.mono,
    fontSize: themeContract.px[12],
    lineHeight: themeContract.px[16],
    textTransform: 'uppercase',
  }),
}
