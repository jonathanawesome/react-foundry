import { style, themeContract } from '@react-foundry/style'

export const accessibilityCheckerStyles = {
  container: style({
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: themeContract.colors.surface,
    borderTop: `1px solid ${themeContract.colors.border}`,
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
    borderBottom: `1px solid ${themeContract.colors.border}`,
    backgroundColor: themeContract.colors.surfaceSubtle,
  }),

  toggleButton: style({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    color: themeContract.colors.textStrong,
    fontSize: 14,
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
    fontSize: 12,
    animation: 'pulse 1.5s ease-in-out infinite',
  }),

  violationCount: style({
    marginLeft: 'auto',
    backgroundColor: 'rgba(217, 50, 81, 0.1)',
    color: '#d93251',
    padding: '2px 8px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
  }),

  passedIndicator: style({
    marginLeft: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    color: '#10b981',
    fontSize: 12,
    fontWeight: 500,
  }),

  rescanButton: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'none',
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: 4,
    cursor: 'pointer',
    padding: '4px 8px',
    color: themeContract.colors.textStrong,
    ':hover': {
      backgroundColor: themeContract.colors.bg,
    },
    ':disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
    },
  }),

  content: style({
    flex: 1,
    overflowY: 'auto',
    padding: 16,
  }),

  noViolations: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 32,
    color: '#10b981',
    fontSize: 14,
  }),

  violation: style({
    marginBottom: 12,
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: 6,
    overflow: 'hidden',
  }),

  violationSummary: style({
    cursor: 'pointer',
    padding: 12,
    backgroundColor: themeContract.colors.surfaceSubtle,
    ':hover': {
      backgroundColor: themeContract.colors.bg,
    },
    '::marker': {
      content: '""',
    },
  }),

  violationHeader: style({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  }),

  violationTitle: style({
    flex: 1,
    fontWeight: 500,
    fontSize: 14,
  }),

  impact: style({
    padding: '2px 6px',
    borderRadius: 4,
    fontSize: 11,
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
    fontSize: 12,
    color: themeContract.colors.text,
  }),

  violationDetails: style({
    padding: 16,
    backgroundColor: themeContract.colors.surface,
  }),

  description: style({
    marginBottom: 16,
    fontSize: 13,
    color: themeContract.colors.text,
    lineHeight: 1.5,
  }),

  nodes: style({
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    marginBottom: 16,
  }),

  node: style({
    padding: 12,
    backgroundColor: themeContract.colors.surfaceSubtle,
    borderRadius: 4,
    border: `1px solid ${themeContract.colors.border}`,
  }),

  nodeSelector: style({
    marginBottom: 8,
    fontSize: 12,
    fontFamily: 'monospace',
    color: themeContract.colors.textStrong,
    overflowX: 'auto',
  }),

  nodeMessage: style({
    fontSize: 13,
    color: themeContract.colors.text,
    lineHeight: 1.4,
  }),

  helpLink: style({
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 13,
    color: themeContract.colors.brand,
    textDecoration: 'none',
    ':hover': {
      textDecoration: 'underline',
    },
  }),
}
