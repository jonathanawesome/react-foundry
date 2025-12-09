import { build as viteBuild } from 'vite'
import pc from 'picocolors'
import { loadConfig } from '../config/load-config'
import { createViteConfig } from '../vite/create-config'

export async function build(root: string = process.cwd()) {
  try {
    console.log(pc.cyan('Building React Foundry for production...\n'))

    // Load config
    const config = await loadConfig(root)

    // Create Vite config
    const viteConfig = createViteConfig(config, root)

    // Build
    await viteBuild({
      ...viteConfig,
      mode: 'production',
    })

    console.log(pc.green('\n✓ Build completed successfully\n'))
  } catch (error) {
    console.error(pc.red('Build failed:'), error)
    process.exit(1)
  }
}
