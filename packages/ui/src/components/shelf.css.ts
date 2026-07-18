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
    right: 0,
    bottom: 0,
    width: SHELF_WIDTH,
    maxWidth: '90vw',
    display: 'flex',
    flexDirection: 'column',

    paddingTop: 48,

    background: themeContract.colors.neutral1,
    borderLeft: `1px solid ${themeContract.colors.neutral4}`,

    transform: 'translateX(100%)',
    transition: `transform 0.3s ${themeContract.motion.authentic}`,

    selectors: {
      '&[data-open="true"]': {
        transform: 'translateX(0)',
      },
      '&[data-pinned="true"]': {
        transform: 'translateX(0)',
        transition: 'none',
        borderLeft: `1px solid ${themeContract.colors.neutral4}`,
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

  category: style({
    marginBottom: themeContract.px[24],
  }),

  categoryTitle: style({
    fontSize: themeContract.px[10],
    fontWeight: 600,
    textTransform: 'uppercase',
    color: themeContract.colors.neutral6,
    marginBottom: themeContract.px[12],
    letterSpacing: themeContract.px[1],
  }),

  componentList: style({
    listStyle: 'none',
  }),

  componentItem: style({
    marginBottom: themeContract.px[8],
  }),

  componentTitle: style({
    display: 'block',
    width: '100%',
    textAlign: 'left',
    fontSize: themeContract.px[14],
    fontWeight: 500,
    color: themeContract.colors.neutral7,
    marginBottom: themeContract.px[6],
    paddingLeft: themeContract.px[2],
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: `color 0.2s ${themeContract.motion.authentic}`,

    ':hover': {
      color: themeContract.colors.neutral8,
    },

    selectors: {
      '&[data-expanded="true"]': {
        color: themeContract.colors.neutral8,
        marginBottom: themeContract.px[8],
      },
    },
  }),

  section: style({
    marginBottom: themeContract.px[2],
    marginLeft: themeContract.px[4],
  }),

  sectionHeader: style({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: themeContract.px[20],
    fontSize: themeContract.px[14],
    fontWeight: 500,
    color: themeContract.colors.neutral6,

    ':hover': {
      color: themeContract.colors.neutral8,
      backgroundColor: themeContract.colors.neutral3,
    },

    selectors: {
      '&[data-active="true"]': {
        color: themeContract.colors.neutral8,
      },
    },
  }),

  sectionList: style({
    listStyle: 'none',
    margin: 0,
    padding: 0,
    marginLeft: themeContract.px[16],
  }),

  itemButton: style({
    display: 'flex',
    alignItems: 'center',
    height: themeContract.px[24],
    textAlign: 'left',
    border: 'none',
    backgroundColor: 'transparent',
    color: themeContract.colors.neutral6,
    cursor: 'pointer',
    fontSize: themeContract.px[14],
    transition: `background-color 0.2s ${themeContract.motion.authentic}`,

    ':hover': {
      color: themeContract.colors.neutral8,
    },

    selectors: {
      '&[data-active="true"]': {
        color: themeContract.colors.neutral8,
        fontWeight: 600,
      },
    },
  }),
}
