import { style, themeContract } from '@react-foundry/style'

import { NAV_HEIGHT, SHELF_WIDTH } from '../constants'

export const navigationStyles = {
  // A horizontal bar along the bottom of the shelf column, separated from the
  // nav tree above it by a top border. Stays put when the shelf closes, since it
  // holds the button that reopens it.
  container: style({
    position: 'fixed',
    bottom: 0,
    left: 0,
    zIndex: 10,
    width: SHELF_WIDTH,
    maxWidth: '90vw',
    height: NAV_HEIGHT,

    display: 'flex',
    alignItems: 'center',
    gap: themeContract.px[2],
    padding: `0 ${themeContract.px[12]}`,

    background: themeContract.colors.neutral1,
    borderTop: `1px solid ${themeContract.colors.neutral4}`,
    borderRight: `1px solid ${themeContract.colors.neutral4}`,
  }),

  // 24x24 hit target with a 16px icon, flat with a subtle hover.
  item: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: themeContract.px[24],
    height: themeContract.px[24],

    borderRadius: themeContract.radii.small,
    background: 'none',
    border: 'none',
    color: themeContract.colors.neutral7,
    cursor: 'pointer',
    transition: `background 0.15s ${themeContract.motion.authentic}`,

    ':hover': {
      background: themeContract.colors.neutral3,
      color: themeContract.colors.neutral8,
    },
  }),

  // Divides the shelf/panel controls from the view controls.
  separator: style({
    width: '1px',
    height: themeContract.px[16],
    margin: `0 ${themeContract.px[4]}`,
    background: themeContract.colors.neutral5,
  }),
}
