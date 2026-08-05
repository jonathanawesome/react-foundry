import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import pc from 'picocolors'
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
  } else {
    // Defaulting silently starts a working-looking server with an empty shelf, which
    // reads as "discovery is broken" rather than "you are in the wrong directory".
    // Easy to hit under a hoisting package manager, where the `foundry` binary is
    // installed at the workspace root and runs happily from there. Naming the
    // directory and the glob answers both halves of "why is nothing showing up".
    console.warn(
      pc.yellow(`  No foundry config found in ${root}`),
      pc.dim(`using defaults (previews: ${DEFAULT_CONFIG.previews})`)
    )
  }

  // Merge with defaults
  return {
    ...DEFAULT_CONFIG,
    ...userConfig,
    viteConfig: userConfig.viteConfig || {},
  }
}
