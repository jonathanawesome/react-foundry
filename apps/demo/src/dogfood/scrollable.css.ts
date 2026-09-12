import { style } from '@react-foundry/style'

/** A bordered viewport small enough that the content has to scroll. */
export const viewport = style({
  border: '1px solid rgba(128, 128, 128, 0.3)',
  borderRadius: 8,
  padding: 12,
  width: 260,
})

export const tall = style({ height: 160 })
