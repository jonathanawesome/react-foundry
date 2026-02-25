import { style, themeContract } from '@react-foundry/style'

export const navigationStyles = {
  container: style({
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex: 1000,
  }),

  item: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    width: themeContract.px[32],
    height: themeContract.px[32],

    borderRadius: '50%',
    background: themeContract.colors.surfaceSubtle,
    border: `1px solid ${themeContract.colors.border}`,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    cursor: 'pointer',
    transition: `all 0.15s ${themeContract.motion.authentic}`,

    ':hover': {
      background: themeContract.colors.surface,
      boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
      transform: 'translateY(-2px)',
    },

    ':active': {
      transform: 'translateY(0)',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    },
  }),
}
