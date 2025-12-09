import { style } from '@react-foundry/style'

export const layout = style({
  height: '100vh',
  width: '100vw',
  overflow: 'hidden',
  position: 'relative',
  display: 'flex',

  selectors: {
    '&[data-shelf-pinned="true"]': {
      paddingRight: '320px',
    },
  },
})
