import { recipe, themeContract } from '@react-foundry/style'

import { iconColor } from '../icon/icon.css'

// A square hit target around the icon, flat with a subtle hover and a filled
// active state for toggles: 24px around a 16px icon, or 20px around a 12px one
// for a control that sits in a line of text, like a section's caret. The icon's
// color is driven through `iconColor`, since the Icon wrapper sets its own
// `color` and would otherwise ignore ours.
export const iconButtonStyles = recipe({
  base: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  variants: {
    size: {
      sm: { width: themeContract.px[20], height: themeContract.px[20] },
      md: { width: themeContract.px[24], height: themeContract.px[24] },
    },
  },
  defaultVariants: { size: 'md' },
})
