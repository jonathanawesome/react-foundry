import { createServer } from 'vite'
import pc from 'picocolors'
import { loadConfig } from '../config/load-config'
import { createViteConfig } from '../vite/create-config'

export async function dev(root: string = process.cwd()) {
  try {
    console.log(pc.cyan('Starting React Foundry dev server...\n'))

    // Load config
    const config = await loadConfig(root)

    // Create Vite config
    const viteConfig = createViteConfig(config, root)

    // Create and start Vite dev server
    const server = await createServer(viteConfig)
    await server.listen()

    server.printUrls()
    console.log()
  } catch (error) {
    console.error(pc.red('Failed to start dev server:'), error)
    process.exit(1)
  }
}
