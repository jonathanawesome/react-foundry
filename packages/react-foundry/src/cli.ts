import cac from 'cac'

import { build } from './commands/build'
import { dev } from './commands/dev'
import { preview } from './commands/preview'

const cli = cac('foundry')

cli
  .command('[root]', 'Start dev server')
  .alias('dev')
  .alias('serve')
  .action(async (root?: string) => {
    await dev(root)
  })

cli.command('build [root]', 'Build for production').action(async (root?: string) => {
  await build(root)
})

cli
  .command('preview [root]', 'Preview production build')
  .action(async (root?: string) => {
    await preview(root)
  })

cli.help()
cli.version('0.0.1')

cli.parse()
