import { resolve } from 'node:path'
import { glob } from 'glob'
import type { Plugin } from 'vite'

const VIRTUAL_MODULE_ID = 'virtual:react-foundry-previews'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export function createVirtualModulePlugin(
  previewsPattern: string,
  userRoot: string,
  viteRoot: string
): Plugin {
  // Construct the absolute path to the user's root directory and append the pattern
  const absoluteUserRoot = userRoot.split('\\').join('/')

  // Ensure pattern doesn't start with / or ./
  const cleanPattern = previewsPattern.replace(/^\.?\//, '')

  const searchPattern = resolve(userRoot, cleanPattern)

  console.log('[React Foundry] Searching for preview files:', searchPattern)
  console.log('[React Foundry] User root:', userRoot)
  console.log('[React Foundry] Vite root:', viteRoot)

  return {
    name: 'react-foundry:virtual-previews',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },
    async load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        // Find all preview files using Node's glob
        const files = await glob(searchPattern, { absolute: true })

        console.log('[React Foundry] Found preview files:', files)

        // Generate explicit imports for each file
        const imports = files.map((file, index) => {
          const normalizedPath = file.split('\\').join('/')
          return `import * as module${index} from '${normalizedPath}';`
        }).join('\n')

        const moduleObject = files.map((file, index) => {
          const normalizedPath = file.split('\\').join('/')
          return `  '${normalizedPath}': module${index},`
        }).join('\n')

        const code = `${imports}

const previewModules = {
${moduleObject}
};

export default previewModules;
`
        console.log('[React Foundry] Generated virtual module code:', code)
        return code
      }
    },
  }
}
