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

    selectors: {
      // The canvas mounts on every surface so the consumer's Provider stays mounted,
      // but with nothing to show it must take no room: the fallback chrome beside it
      // occupies the pane instead.
      //
      // All three declarations are load-bearing. `overflow: hidden` is not cosmetic: a
      // flex item's automatic minimum size (`min-height: auto`) applies only while
      // overflow is `visible`, so without it a Provider that renders a wrapper element
      // would hold the pane open to that wrapper's height and push the chrome down.
      // `padding: 0` matters because `flex-basis` resolves against the border box under
      // `box-sizing: border-box`, which would otherwise floor the pane at 64px.
      '&[data-empty="true"]': {
        flex: '0 0 0',
        padding: 0,
        overflow: 'hidden',
      },
    },
  }),

  // `flex: 1` rather than `height: 100%`, matching previewPane: the checker panel is a
  // sibling row in this column, so a percentage height states the wrong intent even
  // though flex-shrink happens to save it.
  noSelection: style({
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: themeContract.colors.textMuted,
    fontSize: '16px',
  }),
}
