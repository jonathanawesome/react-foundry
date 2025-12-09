import { style } from '@react-foundry/style'

export const previewStyles = {
  previewContainer: style({
    height: '100vh',
    width: '100vw',
    display: 'flex',
    flexDirection: 'column',
  }),

  previewPane: style({
    flex: 1,
    padding: '32px',
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
    fontSize: '16px',
  }),
}
