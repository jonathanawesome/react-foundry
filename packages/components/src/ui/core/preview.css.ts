import { style } from '@react-foundry/style'

import { SHELF_WIDTH } from './constants'

export const previewStyles = {
  previewContainer: style({
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',

    selectors: {
      '&[data-shelf-open="true"]': {
        paddingRight: SHELF_WIDTH,
      },
    },
  }),

  previewPane: style({
    flex: 1,
    padding: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'auto',
  }),

  noSelection: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: '#999',
    fontSize: 14,
  }),
}
