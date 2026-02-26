import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import type { ThemeConfig } from '../types'

export function writeThemeConfig(
  theme: ThemeConfig | undefined,
  cacheDir: string
): string {
  const themeColors = {
    dark: theme?.colors?.dark ?? {},
    light: theme?.colors?.light ?? {},
  }

  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }

  const filePath = resolve(cacheDir, 'react-foundry-config.js')
  const content = `export const themeColors = ${JSON.stringify(themeColors)};\n`

  writeFileSync(filePath, content, 'utf-8')
  return filePath
}
