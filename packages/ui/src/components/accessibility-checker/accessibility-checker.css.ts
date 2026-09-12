import { style, themeContract } from '@react-foundry/style'

const PANEL_HEIGHT = '40vh'

/**
 * Pinned, not measured, so that collapsing has a definite height to animate to. CSS
 * cannot transition to `auto`, so a header that sized itself to its content would leave
 * the collapse as an instant jump, which is what it used to be.
 */
const HEADER_HEIGHT = '48px'

export const accessibilityCheckerStyles = {
  /**
   * A flow row at the bottom of the canvas column, not an overlay. The shelf and props
   * panel are `position: fixed` but the layout reserves their gutters with padding, so
   * neither covers the canvas; this reserves its own height the same way, by taking part
   * in the column rather than floating above it.
   *
   * Three states, all definite heights so every move between them animates: closed is
   * nothing, open is the header alone, open and expanded is the full panel. The easing
   * and duration match the shelf and props panel slide.
   *
   * `position: relative` only exists to make `zIndex` apply, and keeps the documented
   * order of toolbar (1001) over panel (1000) over highlight overlay (999). It does not
   * create a containing block for `position: fixed` descendants the way a transform would.
   */
  container: style({
    position: 'relative',
    zIndex: 1000,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',

    backgroundColor: themeContract.colors.panel,

    // Border and shadow collapse with the panel. A zero-height element still paints its
    // shadow, so leaving it on would smudge a line across the bottom of a closed canvas.
    height: 0,
    borderTop: `0 solid ${themeContract.colors.border}`,
    transition: [
      `height 0.3s ${themeContract.motion.authentic}`,
      `border-top-width 0.3s ${themeContract.motion.authentic}`,
    ].join(', '),

    selectors: {
      '&[data-open="true"]': {
        height: HEADER_HEIGHT,
        borderTopWidth: '1px',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
      },
      '&[data-open="true"][data-expanded="true"]': {
        height: PANEL_HEIGHT,
      },
    },
  }),

  // Height is pinned rather than derived from padding, because it is the collapsed height
  // of the whole panel and so has to be a value the container can animate to. Vertical
  // padding is dropped and the row centers instead: with padding, the natural content
  // height (~26px plus 24px of padding plus the border) exceeds 48px and gets clipped.
  header: style({
    height: HEADER_HEIGHT,
    boxSizing: 'border-box',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 16px',
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

  themeLabel: style({
    fontSize: '12px',
    fontWeight: 400,
    color: themeContract.colors.textMuted,
  }),

  scanningIndicator: style({
    marginLeft: 'auto',
    color: themeContract.colors.accent,
    fontSize: '12px',
    animation: 'pulse 1.5s ease-in-out infinite',
  }),

  // Holds the right-hand status: the issue count, the pass mark, the unchecked count.
  // Grouping them means only the group needs pushing right, however many are showing.
  headerStatus: style({
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  }),

  passedIndicator: style({
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

  // Rendered by the Scrollable component, which supplies overflow + scrollbar styling.
  // `minHeight: 0` lets it shrink inside the column while the panel collapses, instead of
  // holding the panel open at its content height.
  content: style({
    flex: 1,
    minHeight: 0,
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

  scopeNote: style({
    margin: '0 0 16px',
    padding: '8px 12px',
    borderRadius: '4px',
    border: `1px solid ${themeContract.colors.border}`,
    fontSize: '12px',
    lineHeight: 1.5,
    color: themeContract.colors.textMuted,
  }),

  // Separates the "could not be checked" group from the violations above it.
  section: style({
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: `1px solid ${themeContract.colors.border}`,
  }),

  sectionHeading: style({
    margin: '0 0 4px',
    fontSize: '13px',
    fontWeight: 600,
    color: themeContract.colors.textStrong,
  }),

  sectionNote: style({
    margin: '0 0 12px',
    fontSize: '12px',
    lineHeight: 1.5,
    color: themeContract.colors.textMuted,
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
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: themeContract.colors.textStrong,
  }),

  // `minWidth: 0` or the flex child refuses to shrink below its content width and pushes
  // the locate button out of the row instead of scrolling.
  nodeSelectorText: style({
    flex: 1,
    minWidth: 0,
    overflowX: 'auto',
  }),

  locateButton: style({
    flexShrink: 0,
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
