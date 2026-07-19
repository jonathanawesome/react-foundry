import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { NavItem } from '@react-foundry/core'

import type { ThemeConfig } from '../types'

export interface FoundryRuntimeConfig {
  theme?: ThemeConfig
  title?: string
  /** The declared nav tree, which the browser needs to order the shelf. */
  nav?: NavItem[]
}

export function writeFoundryConfig(
  config: FoundryRuntimeConfig,
  cacheDir: string
): string {
  const themeColors = {
    dark: config.theme?.colors?.dark ?? {},
    light: config.theme?.colors?.light ?? {},
  }

  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }

  const filePath = resolve(cacheDir, 'react-foundry-config.js')
  const content = [
    `export const themeColors = ${JSON.stringify(themeColors)};`,
    `export const foundryTitle = ${JSON.stringify(config.title ?? '')};`,
    `export const foundryNav = ${JSON.stringify(config.nav ?? [])};`,
    '',
  ].join('\n')

  writeFileSync(filePath, content, 'utf-8')
  return filePath
}
