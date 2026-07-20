import { style, themeContract } from '@react-foundry/style'

/**
 * Styles for the Base UI previews.
 *
 * Base UI ships behaviour without appearance, so every part needs styling. These
 * live in one file rather than one per component because they exist to make the
 * previews legible, not to be a design system.
 */

const focusRing = {
  outline: `2px solid ${themeContract.colors.accent}`,
  outlineOffset: '2px',
} as const

export const layout = {
  stack: style({
    display: 'flex',
    flexDirection: 'column',
    gap: themeContract.px[16],
    minWidth: themeContract.px[64],
  }),

  row: style({
    display: 'flex',
    alignItems: 'center',
    gap: themeContract.px[12],
  }),

  label: style({
    fontFamily: themeContract.fonts.sans,
    fontSize: themeContract.px[14],
    color: themeContract.colors.textStrong,
    cursor: 'pointer',
    userSelect: 'none',
  }),

  hint: style({
    fontFamily: themeContract.fonts.sans,
    fontSize: themeContract.px[12],
    color: themeContract.colors.textMuted,
  }),
}

export const checkbox = {
  root: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: themeContract.px[20],
    height: themeContract.px[20],
    padding: 0,
    flexShrink: 0,
    borderRadius: themeContract.radii.small,
    border: `1px solid ${themeContract.colors.border}`,
    backgroundColor: themeContract.colors.panel,
    cursor: 'pointer',
    transition: `all 0.15s ${themeContract.motion.authentic}`,

    ':focus-visible': focusRing,

    selectors: {
      '&[data-checked], &[data-indeterminate]': {
        backgroundColor: themeContract.colors.accent,
        borderColor: themeContract.colors.accent,
      },
      '&[data-disabled]': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  }),

  indicator: style({
    display: 'flex',
    color: themeContract.colors.panel,

    selectors: {
      '&[data-unchecked]': {
        display: 'none',
      },
    },
  }),
}

export const switchStyles = {
  root: style({
    position: 'relative',
    display: 'block',
    width: themeContract.px[40],
    height: themeContract.px[24],
    padding: 0,
    flexShrink: 0,
    borderRadius: themeContract.radii.large,
    border: `1px solid ${themeContract.colors.border}`,
    backgroundColor: themeContract.colors.border,
    cursor: 'pointer',
    transition: `background-color 0.15s ${themeContract.motion.authentic}`,

    ':focus-visible': focusRing,

    selectors: {
      '&[data-checked]': {
        backgroundColor: themeContract.colors.accent,
        borderColor: themeContract.colors.accent,
      },
      '&[data-disabled]': {
        opacity: 0.5,
        cursor: 'not-allowed',
      },
    },
  }),

  thumb: style({
    display: 'block',
    width: themeContract.px[18],
    height: themeContract.px[18],
    borderRadius: '50%',
    backgroundColor: themeContract.colors.panel,
    transition: `transform 0.15s ${themeContract.motion.authentic}`,
    transform: `translateX(${themeContract.px[2]})`,

    selectors: {
      '&[data-checked]': {
        transform: `translateX(${themeContract.px[18]})`,
      },
    },
  }),
}

export const slider = {
  root: style({
    display: 'flex',
    flexDirection: 'column',
    gap: themeContract.px[8],
    width: '260px',
    fontFamily: themeContract.fonts.sans,
  }),

  header: style({
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: themeContract.px[14],
    color: themeContract.colors.textStrong,
  }),

  control: style({
    display: 'flex',
    alignItems: 'center',
    height: themeContract.px[20],
    cursor: 'pointer',
  }),

  track: style({
    position: 'relative',
    width: '100%',
    height: themeContract.px[6],
    borderRadius: themeContract.radii.large,
    backgroundColor: themeContract.colors.border,
  }),

  indicator: style({
    position: 'absolute',
    height: '100%',
    borderRadius: themeContract.radii.large,
    backgroundColor: themeContract.colors.accent,
  }),

  thumb: style({
    width: themeContract.px[16],
    height: themeContract.px[16],
    borderRadius: '50%',
    backgroundColor: themeContract.colors.panel,
    border: `2px solid ${themeContract.colors.accent}`,

    ':focus-visible': focusRing,
  }),
}

const surface = {
  borderRadius: themeContract.radii.medium,
  border: `1px solid ${themeContract.colors.border}`,
  backgroundColor: themeContract.colors.panel,
  boxShadow: themeContract.shadows.wide,
  fontFamily: themeContract.fonts.sans,
} as const

export const dialog = {
  backdrop: style({
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(2px)',
  }),

  popup: style({
    ...surface,
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '380px',
    maxWidth: '90vw',
    padding: themeContract.px[24],
  }),

  title: style({
    fontSize: themeContract.px[18],
    fontWeight: 600,
    color: themeContract.colors.textStrong,
    marginBottom: themeContract.px[8],
  }),

  description: style({
    fontSize: themeContract.px[14],
    color: themeContract.colors.textBody,
    marginBottom: themeContract.px[20],
    lineHeight: 1.5,
  }),

  actions: style({
    display: 'flex',
    justifyContent: 'flex-end',
    gap: themeContract.px[8],
  }),
}

export const popover = {
  popup: style({
    ...surface,
    padding: themeContract.px[16],
    maxWidth: '260px',
    fontSize: themeContract.px[14],
    color: themeContract.colors.textBody,
    lineHeight: 1.5,
  }),

  title: style({
    fontSize: themeContract.px[14],
    fontWeight: 600,
    color: themeContract.colors.textStrong,
    marginBottom: themeContract.px[4],
  }),
}

export const accordion = {
  root: style({
    width: '320px',
    fontFamily: themeContract.fonts.sans,
    borderRadius: themeContract.radii.medium,
    border: `1px solid ${themeContract.colors.border}`,
    overflow: 'hidden',
  }),

  item: style({
    selectors: {
      '& + &': {
        borderTop: `1px solid ${themeContract.colors.border}`,
      },
    },
  }),

  trigger: style({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: `${themeContract.px[12]} ${themeContract.px[16]}`,
    border: 'none',
    backgroundColor: themeContract.colors.panel,
    color: themeContract.colors.textStrong,
    fontSize: themeContract.px[14],
    fontWeight: 500,
    textAlign: 'left',
    cursor: 'pointer',

    ':hover': {
      backgroundColor: themeContract.colors.stateHover,
    },
    ':focus-visible': focusRing,
  }),

  panel: style({
    padding: `${themeContract.px[12]} ${themeContract.px[16]}`,
    fontSize: themeContract.px[14],
    color: themeContract.colors.textBody,
    lineHeight: 1.5,
  }),
}

export const tabs = {
  root: style({
    width: '340px',
    fontFamily: themeContract.fonts.sans,
  }),

  list: style({
    position: 'relative',
    display: 'flex',
    gap: themeContract.px[4],
    borderBottom: `1px solid ${themeContract.colors.border}`,
  }),

  tab: style({
    padding: `${themeContract.px[8]} ${themeContract.px[12]}`,
    border: 'none',
    background: 'none',
    color: themeContract.colors.textMuted,
    fontSize: themeContract.px[14],
    fontWeight: 500,
    cursor: 'pointer',

    ':hover': {
      color: themeContract.colors.textStrong,
    },
    ':focus-visible': focusRing,

    selectors: {
      '&[data-selected]': {
        color: themeContract.colors.textStrong,
      },
    },
  }),

  indicator: style({
    position: 'absolute',
    bottom: '-1px',
    left: 0,
    height: '2px',
    backgroundColor: themeContract.colors.accent,
    width: 'var(--active-tab-width)',
    transform: 'translateX(var(--active-tab-left))',
    transition: `all 0.2s ${themeContract.motion.authentic}`,
  }),

  panel: style({
    padding: `${themeContract.px[16]} 0`,
    fontSize: themeContract.px[14],
    color: themeContract.colors.textBody,
    lineHeight: 1.5,
  }),
}
