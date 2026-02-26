import pc from 'picocolors'
import { preview as vitePreview } from 'vite'
import { loadConfig } from '../config/load-config'
import { createViteConfig } from '../vite/create-config'

export async function preview(root: string = process.cwd()) {
  try {
    console.log(pc.cyan('Starting React Foundry preview server...\n'))

    // Load config
    const config = await loadConfig(root)

    // Create Vite config
    const viteConfig = createViteConfig(config, root)

    // Start preview server
    const server = await vitePreview(viteConfig)

    server.printUrls()
    console.log()
  } catch (error) {
    console.error(pc.red('Failed to start preview server:'), error)
    process.exit(1)
  }
}
