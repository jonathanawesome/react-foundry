/// <reference path="./virtual-modules.d.ts" />
import { themeColors } from 'virtual:react-foundry-config'
import { createTheme } from '@vanilla-extract/css'

import { themeContract } from './theme-contract.css'
import { colorWithAlpha, transformColors } from './utils'

// Anchors: the two poles plus accent, as raw OKLCH triplets (transformColors wraps them
// in oklch()). Everything neutral derives from bg/fg via color-mix in oklab.
const anchors = {
  dark: { bg: '14.6% 0 0', fg: '97.7% 0 0', accent: '62.1% 0.289482 350.9' },
  light: { bg: '98.5% 0 0', fg: '11.6% 0 0', accent: '62.1% 0.289482 350.9' },
}

// Derived surface/text tokens as a percentage toward fg, per mode. Dark uses wider
// spacing than light because discrimination is worse at low luminance.
const ladder = {
  canvas: { dark: 8, light: 4 },
  stateHover: { dark: 8, light: 4 },
  border: { dark: 19, light: 14 },
  textMuted: { dark: 58, light: 53 },
  textBody: { dark: 91, light: 74 },
}

// Status colors can't derive from bg/fg; own per-mode literals, dark variants lifted for
// legibility on dark surfaces.
const status = {
  statusCritical: { dark: '#f2637f', light: '#d93251' },
  statusSerious: { dark: '#f5924a', light: '#e56910' },
  statusModerate: { dark: '#e0c04a', light: '#c29a00' },
  statusMinor: { dark: '#5aa9e6', light: '#0077c7' },
  statusSuccess: { dark: '#34d399', light: '#10b981' },
}

// Private per-mode tint for shadows. Not a contract token, so shadows don't follow a
// consumer's bg override; promote to a real token later if that matters.
const shadowTint = { dark: '30.1% 0 0', light: '86.5% 0 0' }

// The contract leaves are `var(--foundry-colors-*)` strings, so derived tokens can
// reference the anchors and recompute in the browser when a consumer overrides bg/fg.
const { bg, fg } = themeContract.colors
const mixToFg = (pct: number) => `color-mix(in oklab, ${bg}, ${fg} ${pct}%)`

/**
 * Builds the full color set for a mode: anchors as raw triplets, surface/text tokens as
 * color-mix expressions, status as literals, then overlays the consumer's overrides.
 * Unknown override keys are dropped with a warning rather than crashing createTheme.
 */
function buildColors(mode: 'dark' | 'light') {
  const a = anchors[mode]
  const base = {
    bg: a.bg,
    fg: a.fg,
    accent: a.accent,
    panel: bg, // sits at the bg pole; follows a bg override
    textStrong: fg, // sits at the fg pole
    canvas: mixToFg(ladder.canvas[mode]),
    stateHover: mixToFg(ladder.stateHover[mode]),
    border: mixToFg(ladder.border[mode]),
    textMuted: mixToFg(ladder.textMuted[mode]),
    textBody: mixToFg(ladder.textBody[mode]),
    statusCritical: status.statusCritical[mode],
    statusSerious: status.statusSerious[mode],
    statusModerate: status.statusModerate[mode],
    statusMinor: status.statusMinor[mode],
    statusSuccess: status.statusSuccess[mode],
  }

  const known = new Set(Object.keys(base))
  const unknown: string[] = []
  for (const [key, value] of Object.entries(themeColors[mode] ?? {})) {
    if (value == null) continue
    if (known.has(key)) {
      ;(base as Record<string, string>)[key] = value
    } else {
      unknown.push(key)
    }
  }
  if (unknown.length > 0) {
    // biome-ignore lint/suspicious/noConsole: surface a config typo to the developer
    console.warn(
      `[react-foundry] ignoring unknown theme color keys: ${unknown.join(', ')}`
    )
  }

  return base
}

// Shared tokens that don't change between themes
const sharedTokens = {
  px: {
    1: '0.0625rem',
    2: '0.125rem',
    4: '0.25rem',
    6: '0.375rem',
    8: '0.5rem',
    12: '0.75rem',
    14: '0.875rem',
    16: '1rem',
    18: '1.125rem',
    20: '1.25rem',
    24: '1.5rem',
    32: '2rem',
    40: '2.5rem',
    64: '4rem',
  },

  radii: {
    small: '0.125rem',
    medium: '0.25rem',
    large: '0.375rem',
  },

  fonts: {
    sans: '"InstrumentSans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    mono: '"SF Mono", Monaco, "JetBrains Mono", Consolas, monospace',
  },

  motion: {
    authentic: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

export const darkTheme = createTheme(themeContract, {
  colors: transformColors(buildColors('dark')),

  ...sharedTokens,

  shadows: {
    tight: `${colorWithAlpha(shadowTint.dark, 0.45)} 0px 1px 5px 1px`,
    wide: `${colorWithAlpha(shadowTint.dark, 0.35)} 0px 10px 38px -10px, ${colorWithAlpha(shadowTint.dark, 0.2)} 0px 10px 20px -15px`,
  },
})

export const lightTheme = createTheme(themeContract, {
  colors: transformColors(buildColors('light')),

  ...sharedTokens,

  shadows: {
    tight: `${colorWithAlpha(shadowTint.light, 0.75)} 0px 1px 5px 1px`,
    wide: `${colorWithAlpha(shadowTint.light, 0.35)} 0px 10px 38px -10px, ${colorWithAlpha(shadowTint.light, 0.2)} 0px 10px 20px -15px`,
  },
})
