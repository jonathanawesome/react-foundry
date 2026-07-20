import { style, themeContract } from '@react-foundry/style'

import { SHELF_WIDTH } from '../constants'

export const shelfStyles = {
  overlay: style({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'transparent',
    zIndex: 8,
  }),

  shelf: style({
    position: 'fixed',
    zIndex: 9,
    top: 0,
    left: 0,
    bottom: 0,
    width: SHELF_WIDTH,
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',

    paddingTop: 48,

    background: themeContract.colors.panel,
    borderRight: `1px solid ${themeContract.colors.border}`,

    transform: 'translateX(-100%)',
    transition: `transform 0.3s ${themeContract.motion.authentic}`,

    selectors: {
      '&[data-open="true"]': {
        transform: 'translateX(0)',
      },
    },
  }),

  content: style({
    flex: 1,
    overflow: 'auto',
    padding: themeContract.px[20],
  }),

  sidebar: style({
    overflowY: 'auto',
  }),

  // The tree nests to arbitrary depth, so indentation comes from nesting the
  // lists rather than from a per-level style. Depth 0 sits flush.
  nodeList: style({
    listStyle: 'none',
    margin: 0,
    padding: 0,

    selectors: {
      '&:not([data-depth="0"])': {
        marginLeft: themeContract.px[12],
      },
    },
  }),

  node: style({
    marginBottom: themeContract.px[2],
  }),

  nodeHeader: style({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: themeContract.px[24],
    textAlign: 'left',
    fontSize: themeContract.px[14],
    fontWeight: 500,
    color: themeContract.colors.textMuted,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: `color 0.2s ${themeContract.motion.authentic}`,

    ':hover': {
      color: themeContract.colors.textStrong,
      backgroundColor: themeContract.colors.stateHover,
    },

    selectors: {
      '&[data-expanded="true"]': {
        color: themeContract.colors.textStrong,
      },
    },
  }),

  leafList: style({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    marginLeft: themeContract.px[16],
  }),

  leafLink: style({
    display: 'flex',
    alignItems: 'center',
    height: themeContract.px[24],
    textAlign: 'left',
    border: 'none',
    backgroundColor: 'transparent',
    color: themeContract.colors.textMuted,
    cursor: 'pointer',
    fontSize: themeContract.px[14],
    transition: `background-color 0.2s ${themeContract.motion.authentic}`,

    ':hover': {
      color: themeContract.colors.textStrong,
    },

    selectors: {
      '&[data-active="true"]': {
        color: themeContract.colors.textStrong,
        fontWeight: 600,
      },
    },
  }),
}
