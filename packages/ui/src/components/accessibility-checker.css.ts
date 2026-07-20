import { style, themeContract } from '@react-foundry/style'

import { PANEL_WIDTH, SHELF_WIDTH } from '../constants'

export const accessibilityCheckerStyles = {
  container: style({
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: themeContract.colors.panel,
    borderTop: `1px solid ${themeContract.colors.border}`,
    maxHeight: '40vh',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',

    // Slides up from the bottom on open/close, and its left/right edges ease in
    // sync with the shelf and panel as those slide. Each property only animates
    // when its own value changes, so opening the checker is a pure vertical
    // slide and a shelf toggle is a pure edge slide.
    transform: 'translateY(100%)',
    transition: [
      `transform 0.3s ${themeContract.motion.authentic}`,
      `left 0.3s ${themeContract.motion.authentic}`,
      `right 0.3s ${themeContract.motion.authentic}`,
    ].join(', '),

    selectors: {
      '&[data-open="true"]': {
        transform: 'translateY(0)',
      },
    },
  }),

  containerWithShelf: style({
    left: SHELF_WIDTH,
  }),

  containerWithPanel: style({
    right: PANEL_WIDTH,
  }),

  header: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${themeContract.colors.border}`,
    backgroundColor: themeContract.colors.panel,
  }),

  toggleButton: style({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: themeContract.colors.textStrong,
    fontSize: '14px',
    fontWeight: 500,
    ':hover': {
      opacity: 0.8,
    },
  }),

  title: style({
    fontWeight: 600,
  }),

  scanningIndicator: style({
    marginLeft: 'auto',
    color: themeContract.colors.accent,
    fontSize: '12px',
    animation: 'pulse 1.5s ease-in-out infinite',
  }),

  // Pushes a header item (a Badge) to the far right.
  pushRight: style({
    marginLeft: 'auto',
  }),

  passedIndicator: style({
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: themeContract.colors.statusSuccess,
    fontSize: '12px',
    fontWeight: 500,
  }),

  rescanButton: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: '4px',
    cursor: 'pointer',
    padding: '4px 8px',
    color: themeContract.colors.textStrong,
    ':hover': {
      backgroundColor: themeContract.colors.stateHover,
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  }),

  content: style({
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
  }),

  noViolations: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '32px',
    color: themeContract.colors.statusSuccess,
    fontSize: '14px',
  }),

  violation: style({
    marginBottom: '12px',
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: '6px',
    overflow: 'hidden',
  }),

  violationSummary: style({
    cursor: 'pointer',
    padding: '12px',
    backgroundColor: themeContract.colors.panel,
    ':hover': {
      backgroundColor: themeContract.colors.stateHover,
    },
    '::marker': {
      content: '""',
    },
  }),

  violationHeader: style({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }),

  violationTitle: style({
    flex: 1,
    fontWeight: 500,
    fontSize: '14px',
  }),

  nodeCount: style({
    fontSize: '12px',
    color: themeContract.colors.textBody,
  }),

  violationDetails: style({
    padding: '16px',
    backgroundColor: themeContract.colors.panel,
  }),

  description: style({
    marginBottom: '16px',
    fontSize: '13px',
    color: themeContract.colors.textBody,
    lineHeight: 1.5,
  }),

  nodes: style({
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  }),

  node: style({
    padding: '12px',
    backgroundColor: themeContract.colors.panel,
    borderRadius: '4px',
    border: `1px solid ${themeContract.colors.border}`,
  }),

  nodeSelector: style({
    marginBottom: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: themeContract.colors.textStrong,
    overflowX: 'auto',
  }),

  nodeMessage: style({
    fontSize: '13px',
    color: themeContract.colors.textBody,
    lineHeight: 1.4,
  }),

  helpLink: style({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '13px',
    color: themeContract.colors.accent,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  }),
}
