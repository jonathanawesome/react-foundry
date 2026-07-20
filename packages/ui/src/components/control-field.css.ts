import { style, themeContract } from '@react-foundry/style'

export const controlFieldStyles = {
  field: style({
    display: 'flex',
    flexDirection: 'column',
    gap: themeContract.px[6],
    fontFamily: themeContract.fonts.sans,
  }),

  label: style({
    fontSize: themeContract.px[12],
    fontWeight: 600,
    color: themeContract.colors.textBody,
  }),

  input: style({
    height: themeContract.px[32],
    padding: `0 ${themeContract.px[8]}`,
    fontSize: themeContract.px[14],
    color: themeContract.colors.textStrong,
    background: themeContract.colors.panel,
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: themeContract.radii.small,

    ':focus-visible': {
      outline: `2px solid ${themeContract.colors.accent}`,
      outlineOffset: '1px',
    },
  }),

  // A row for a control whose input sits inline with its label (checkbox).
  inlineField: style({
    display: 'flex',
    alignItems: 'center',
    gap: themeContract.px[8],
    fontFamily: themeContract.fonts.sans,
  }),

  checkbox: style({
    width: themeContract.px[16],
    height: themeContract.px[16],
    accentColor: themeContract.colors.accent,
    cursor: 'pointer',
  }),

  color: style({
    width: themeContract.px[32],
    height: themeContract.px[32],
    padding: 0,
    background: 'none',
    border: `1px solid ${themeContract.colors.border}`,
    borderRadius: themeContract.radii.small,
    cursor: 'pointer',
  }),

  range: style({
    width: '100%',
    accentColor: themeContract.colors.accent,
    cursor: 'pointer',
  }),

  rangeRow: style({
    display: 'flex',
    alignItems: 'center',
    gap: themeContract.px[8],
  }),

  rangeValue: style({
    minWidth: themeContract.px[24],
    fontSize: themeContract.px[12],
    color: themeContract.colors.textMuted,
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
  }),

  radioGroup: style({
    display: 'flex',
    flexDirection: 'column',
    gap: themeContract.px[8],
  }),

  radioOption: style({
    display: 'flex',
    alignItems: 'center',
    gap: themeContract.px[4],
    fontSize: themeContract.px[14],
    color: themeContract.colors.textStrong,
    cursor: 'pointer',
  }),

  radioInput: style({
    accentColor: themeContract.colors.accent,
    cursor: 'pointer',
  }),
}
