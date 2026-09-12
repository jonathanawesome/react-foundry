import { style, themeContract } from '@react-foundry/style'

import { iconColor } from './icon/icon.css'

// 24x24 hit target with a 16px icon, flat with a subtle hover and a filled
// active state for toggles. The icon's color is driven through `iconColor`, since
// the Icon wrapper sets its own `color` and would otherwise ignore ours.
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
    vars: { [iconColor]: themeContract.colors.textStrong },
  },

  selectors: {
    '&[data-active="true"]': {
      background: themeContract.colors.border,
      vars: { [iconColor]: themeContract.colors.textStrong },
    },
  },
})
