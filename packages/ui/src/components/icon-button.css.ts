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
  color: themeContract.colors.neutral7,
  cursor: 'pointer',
  transition: `background 0.15s ${themeContract.motion.authentic}`,

  ':hover': {
    background: themeContract.colors.neutral3,
    color: themeContract.colors.neutral8,
  },

  selectors: {
    '&[data-active="true"]': {
      background: themeContract.colors.neutral4,
      color: themeContract.colors.neutral8,
    },
  },
})
