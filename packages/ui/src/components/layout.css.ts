import { style, themeContract } from '@react-foundry/style'

import { PANEL_WIDTH, SHELF_WIDTH } from '../constants'

export const layout = style({
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',

  // Painted here rather than left to `body` alone. Consumer global stylesheets very
  // commonly paint the app shell via `#root`, which in foundry's document is this
  // element's parent, so their paint covered the whole viewport including the canvas.
  // A `#root` rule of foundry's own would not fix it: same specificity, and the
  // consumer's sheet loads after foundry's, so theirs wins on source order. Painting
  // foundry's own layout root sidesteps specificity entirely, since a child paints over
  // its parent's background. `background-color` does not inherit, so the canvas still
  // takes nothing from foundry: it shows this backdrop exactly as it showed `body`'s.
  backgroundColor: themeContract.colors.canvas,

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
