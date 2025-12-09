import { style, themeContract } from '@react-foundry/style'

export const accessibilityCheckerStyles = {
  container: style({
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: themeContract.colors.neutral1,
    borderTop: `1px solid ${themeContract.colors.neutral5}`,
    maxHeight: '40vh',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.1)',
  }),

  containerWithShelf: style({
    right: 320,
  }),

  header: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: `1px solid ${themeContract.colors.neutral5}`,
    backgroundColor: themeContract.colors.neutral2,
  }),

  toggleButton: style({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: themeContract.colors.neutral8,
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
    color: themeContract.colors.brand,
    fontSize: '12px',
    animation: 'pulse 1.5s ease-in-out infinite',
  }),

  violationCount: style({
    marginLeft: 'auto',
    backgroundColor: 'rgba(217, 50, 81, 0.1)',
    color: '#d93251',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 500,
  }),

  passedIndicator: style({
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    color: '#10b981',
    fontSize: '12px',
    fontWeight: 500,
  }),

  rescanButton: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: `1px solid ${themeContract.colors.neutral5}`,
    borderRadius: '4px',
    cursor: 'pointer',
    padding: '4px 8px',
    color: themeContract.colors.neutral8,
    ':hover': {
      backgroundColor: themeContract.colors.neutral3,
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
    color: '#10b981',
    fontSize: '14px',
  }),

  violation: style({
    marginBottom: '12px',
    border: `1px solid ${themeContract.colors.neutral5}`,
    borderRadius: '6px',
    overflow: 'hidden',
  }),

  violationSummary: style({
    cursor: 'pointer',
    padding: '12px',
    backgroundColor: themeContract.colors.neutral2,
    ':hover': {
      backgroundColor: themeContract.colors.neutral3,
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

  impact: style({
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 600,
    textTransform: 'uppercase',
  }),

  impactCritical: style({
    color: '#d93251',
    backgroundColor: 'rgba(217, 50, 81, 0.1)',
  }),

  impactSerious: style({
    color: '#e56910',
    backgroundColor: 'rgba(229, 105, 16, 0.1)',
  }),

  impactModerate: style({
    color: '#c29a00',
    backgroundColor: 'rgba(194, 154, 0, 0.1)',
  }),

  impactMinor: style({
    color: '#0077c7',
    backgroundColor: 'rgba(0, 119, 199, 0.1)',
  }),

  nodeCount: style({
    fontSize: '12px',
    color: themeContract.colors.neutral7,
  }),

  violationDetails: style({
    padding: '16px',
    backgroundColor: themeContract.colors.neutral1,
  }),

  description: style({
    marginBottom: '16px',
    fontSize: '13px',
    color: themeContract.colors.neutral7,
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
    backgroundColor: themeContract.colors.neutral2,
    borderRadius: '4px',
    border: `1px solid ${themeContract.colors.neutral5}`,
  }),

  nodeSelector: style({
    marginBottom: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: themeContract.colors.neutral8,
    overflowX: 'auto',
  }),

  nodeMessage: style({
    fontSize: '13px',
    color: themeContract.colors.neutral7,
    lineHeight: 1.4,
  }),

  helpLink: style({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: '13px',
    color: themeContract.colors.brand,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  }),
}
