import { resolve } from 'node:path'
import { glob } from 'glob'
import pc from 'picocolors'
import type { Plugin } from 'vite'

const VIRTUAL_MODULE_ID = 'virtual:react-foundry-previews'
const RESOLVED_VIRTUAL_MODULE_ID = `\0${VIRTUAL_MODULE_ID}`

export function createVirtualModulePlugin(
  previewsPattern: string,
  userRoot: string
): Plugin {
  // Ensure pattern doesn't start with / or ./
  const cleanPattern = previewsPattern.replace(/^\.?\//, '')
  const searchPattern = resolve(userRoot, cleanPattern)
  let logged = false

  return {
    name: 'react-foundry:virtual-previews',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const files = await glob(searchPattern, { absolute: true })

        if (!logged) {
          console.log(
            pc.green(
              `  Found ${files.length} preview file${files.length === 1 ? '' : 's'}`
            )
          )
          logged = true
        }

        const imports = files
          .map((file, index) => {
            const normalizedPath = file.split('\\').join('/')
            return `import * as module${index} from '${normalizedPath}';`
          })
          .join('\n')

        const moduleObject = files
          .map((file, index) => {
            const normalizedPath = file.split('\\').join('/')
            return `  '${normalizedPath}': module${index},`
          })
          .join('\n')

        return `${imports}

const previewModules = {
${moduleObject}
};

export default previewModules;
`
      }
    },
  }
}
