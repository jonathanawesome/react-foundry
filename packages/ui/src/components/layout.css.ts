import { style, themeContract } from '@react-foundry/style'

import { PANEL_WIDTH, SHELF_WIDTH } from '../constants'

export const layout = style({
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',

  // Ease the gutters so the canvas resizes in sync with the shelf/panel slide
  // rather than snapping while they animate.
  transition: `padding 0.3s ${themeContract.motion.authentic}`,

  selectors: {
    // Shelf and panel are position: fixed, so padding reserves their gutters
    // and keeps the canvas from sliding underneath them.
    '&[data-shelf-open="true"]': {
      paddingLeft: SHELF_WIDTH,
    },
    '&[data-panel-open="true"]': {
      paddingRight: PANEL_WIDTH,
    },
  },
})
