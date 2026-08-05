import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { NavItem } from '@react-foundry/core'
// Imported from the `/utils` subpath, which is pure: importing the style index would
// execute its `.css.ts` side effects and throw outside vanilla-extract's compiler.
import { arrayToKebabString, transformColors } from '@react-foundry/style/utils'

import { OVERRIDABLE_COLOR_TOKENS, type ThemeConfig, type ThemeFonts } from '../types'

export interface FoundryRuntimeConfig {
  theme?: ThemeConfig
  title?: string
  /** The declared nav tree, which the browser needs to order the shelf. */
  nav?: NavItem[]
}

export interface FoundryConfigPaths {
  /** JS module: `foundryTitle` + `foundryNav`, aliased to `virtual:react-foundry-config`. */
  configPath: string
  /** Plain CSS override sheet, aliased to `virtual:react-foundry-theme`. */
  themePath: string
}

/** Filename of the generated config module, so watchers can find it before it is written. */
export const CONFIG_MODULE_FILE_NAME = 'react-foundry-config.js'

const OVERRIDABLE = new Set<string>(OVERRIDABLE_COLOR_TOKENS)

/** `['colors', 'textMuted'] → '--foundry-colors-text-muted'`, matching the contract. */
function varName(group: 'colors' | 'fonts', key: string): string {
  return `--foundry${arrayToKebabString([group, key])}`
}

/** CSS declarations for a mode's color overrides, dropping unknown keys with a warning. */
function colorDecls(overrides: Record<string, string> | undefined): string[] {
  if (!overrides) return []

  const known: Record<string, string> = {}
  const unknown: string[] = []
  for (const [key, value] of Object.entries(overrides)) {
    if (value == null) continue
    if (OVERRIDABLE.has(key)) {
      known[key] = value
    } else {
      unknown.push(key)
    }
  }
  if (unknown.length > 0) {
    console.warn(
      `[react-foundry] ignoring unknown theme color keys: ${unknown.join(', ')}`
    )
  }

  // transformColors wraps bare OKLCH triplets in oklch(); any other CSS color passes
  // through, so hex/rgb/named all work.
  const transformed = transformColors(known)
  return Object.entries(transformed).map(
    ([key, value]) => `  ${varName('colors', key)}: ${value};`
  )
}

/** Font declarations. Mode-agnostic, so the same lines go in both theme blocks. */
function fontDecls(fonts: ThemeFonts | undefined): string[] {
  if (!fonts) return []
  const decls: string[] = []
  for (const key of ['sans', 'mono'] as const) {
    const value = fonts[key]
    if (value != null) decls.push(`  ${varName('fonts', key)}: ${value};`)
  }
  return decls
}

/**
 * Builds the plain-CSS override sheet. Keying on `html.foundry-light` gives specificity
 * (0,2,0), which outranks the base theme's `.foundry-light` (0,1,0) regardless of load
 * order. Because derived tokens are `color-mix(…, var(--foundry-colors-bg), …)`,
 * overriding an anchor here recomputes the whole ramp at use time.
 */
function buildThemeCss(theme: ThemeConfig | undefined): string {
  const fonts = fontDecls(theme?.fonts)
  const blocks: string[] = []
  for (const mode of ['light', 'dark'] as const) {
    const decls = [...colorDecls(theme?.colors?.[mode]), ...fonts]
    if (decls.length > 0) {
      blocks.push(`html.foundry-${mode} {\n${decls.join('\n')}\n}`)
    }
  }
  return blocks.length > 0 ? `${blocks.join('\n\n')}\n` : ''
}

export function writeFoundryConfig(
  config: FoundryRuntimeConfig,
  cacheDir: string
): FoundryConfigPaths {
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }

  const configPath = resolve(cacheDir, CONFIG_MODULE_FILE_NAME)
  const configContent = [
    `export const foundryTitle = ${JSON.stringify(config.title ?? '')};`,
    `export const foundryNav = ${JSON.stringify(config.nav ?? [])};`,
    '',
  ].join('\n')
  writeFileSync(configPath, configContent, 'utf-8')

  const themePath = resolve(cacheDir, 'foundry-theme.css')
  writeFileSync(themePath, buildThemeCss(config.theme), 'utf-8')

  return { configPath, themePath }
}
