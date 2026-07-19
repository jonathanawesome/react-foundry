import { style } from '@react-foundry/style'

export const previewStyles = {
  previewContainer: style({
    height: '100vh',
    // `flex: 1` + `minWidth: 0` rather than `100vw`, so the canvas respects the
    // layout's left/right padding instead of overflowing under the panels. A
    // `100vw` child ignores that padding; `minWidth: 0` lets it actually shrink.
    flex: 1,
    minWidth: 0,
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
