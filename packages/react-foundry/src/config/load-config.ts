import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { FoundryConfig, ResolvedFoundryConfig } from '../types'
import { DEFAULT_CONFIG } from './defaults'
import { importUserConfig } from './import-config'

const CONFIG_FILE_NAMES = [
  'foundry.config.mjs',
  'foundry.config.js',
  'foundry.config.ts',
  '.foundry/config.mjs',
  '.foundry/config.js',
  '.foundry/config.ts',
]

export function findConfigPath(root: string): string | undefined {
  for (const fileName of CONFIG_FILE_NAMES) {
    const fullPath = resolve(root, fileName)
    if (existsSync(fullPath)) return fullPath
  }
}

export async function loadConfig(
  root: string = process.cwd()
): Promise<ResolvedFoundryConfig> {
  const configPath = findConfigPath(root)

  let userConfig: FoundryConfig = {}

  if (configPath) {
    try {
      const cacheDir = resolve(root, 'node_modules', '.cache', 'react-foundry')
      userConfig = (await importUserConfig(configPath, cacheDir)) as FoundryConfig
    } catch (error) {
      console.error(`Failed to load config from ${configPath}:`, error)
    }
  }

  // Merge with defaults
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    viteConfig: userConfig.viteConfig || {},
  }
}
