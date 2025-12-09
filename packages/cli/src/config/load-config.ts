import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'
import { existsSync } from 'node:fs'
import type { FoundryConfig, ResolvedFoundryConfig } from '../types'
import { DEFAULT_CONFIG } from './defaults'

const CONFIG_FILE_NAMES = [
  'foundry.config.mjs',
  'foundry.config.js',
  'foundry.config.ts',
  '.foundry/config.mjs',
  '.foundry/config.js',
  '.foundry/config.ts',
]

export async function loadConfig(
  root: string = process.cwd()
): Promise<ResolvedFoundryConfig> {
  // Find config file
  let configPath: string | undefined

  for (const fileName of CONFIG_FILE_NAMES) {
    const fullPath = resolve(root, fileName)
    if (existsSync(fullPath)) {
      configPath = fullPath
      break
    }
  }

  let userConfig: FoundryConfig = {}

  if (configPath) {
    try {
      const configUrl = pathToFileURL(configPath).href
      const configModule = await import(configUrl)
      userConfig = configModule.default || {}
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
