import { style, themeContract } from '@react-foundry/style'

// 24x24 hit target with a 16px icon, flat with a subtle hover and a filled
// active state for toggles.
export const iconButtonStyles = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: themeContract.px[24],
  height: themeContract.px[24],

  borderRadius: themeContract.radii.small,
  background: 'none',
  border: 'none',
  color: themeContract.colors.textBody,
  cursor: 'pointer',
  transition: `background 0.15s ${themeContract.motion.authentic}`,

  ':hover': {
    background: themeContract.colors.stateHover,
    color: themeContract.colors.textStrong,
  },

  selectors: {
    '&[data-active="true"]': {
      background: themeContract.colors.border,
      color: themeContract.colors.textStrong,
    },
  },
})
