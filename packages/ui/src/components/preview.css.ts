import { style, themeContract } from '@react-foundry/style'

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

  // `safe center` rather than `center`: plain centering splits negative free space across
  // both sides, so a preview taller or wider than the pane has its top and left edges
  // pushed outside the scrollport, where no amount of scrolling can reach them (scroll
  // offsets cannot go negative). `safe` falls back to start-alignment once it overflows,
  // which keeps the whole preview reachable while still centering anything that fits.
  previewPane: style({
    flex: 1,
    padding: '32px',
    display: 'flex',
    alignItems: 'safe center',
    justifyContent: 'safe center',
    overflow: 'auto',
  }),

  noSelection: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    color: themeContract.colors.textMuted,
    fontSize: '16px',
  }),
}
