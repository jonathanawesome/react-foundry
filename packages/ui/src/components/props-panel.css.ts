import { style, themeContract } from '@react-foundry/style'

import { PANEL_WIDTH } from '../constants'

export const propsPanelStyles = {
  // Mirror of the shelf, on the right: slides in from the right edge, border on
  // the leading (left) side.
  panel: style({
    position: 'fixed',
    zIndex: 9,
    top: 0,
    right: 0,
    bottom: 0,
    width: PANEL_WIDTH,
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',

    paddingTop: 48,

    background: themeContract.colors.panel,
    borderLeft: `1px solid ${themeContract.colors.border}`,

    transform: 'translateX(100%)',
    transition: `transform 0.3s ${themeContract.motion.authentic}`,

    selectors: {
      '&[data-open="true"]': {
        transform: 'translateX(0)',
      },
    },
  }),

  header: style({
    display: 'flex',
    alignItems: 'center',
    height: themeContract.px[24],
    padding: `0 ${themeContract.px[20]}`,
    fontSize: themeContract.px[12],
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: themeContract.px[1],
    color: themeContract.colors.textMuted,
  }),

  content: style({
    flex: 1,
    overflow: 'auto',
    padding: themeContract.px[20],
    display: 'flex',
    flexDirection: 'column',
    gap: themeContract.px[16],
  }),

  empty: style({
    fontSize: themeContract.px[14],
    color: themeContract.colors.textMuted,
    lineHeight: 1.5,
  }),
}
