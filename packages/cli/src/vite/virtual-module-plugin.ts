import { relative, resolve, join } from 'node:path'
import type { Plugin } from 'vite'

const VIRTUAL_MODULE_ID = 'virtual:react-foundry-previews'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

export function createVirtualModulePlugin(
  previewsPattern: string,
  userRoot: string,
  viteRoot: string
): Plugin {
  // Construct the absolute path to the user's root directory and append the pattern
  // For virtual modules, we need to use an absolute path with the glob pattern
  const absoluteUserRoot = userRoot.split('\\').join('/')

  // Ensure pattern doesn't start with / or ./
  const cleanPattern = previewsPattern.replace(/^\.?\//, '')

  const finalPattern = `${absoluteUserRoot}/${cleanPattern}`

  console.log('[React Foundry] Virtual module glob pattern:', finalPattern)
  console.log('[React Foundry] User root:', userRoot)
  console.log('[React Foundry] Vite root:', viteRoot)
  console.log('[React Foundry] Previews pattern:', previewsPattern)
  console.log('[React Foundry] Clean pattern:', cleanPattern)

  return {
    name: 'react-foundry:virtual-previews',
    resolveId(id) {
      if (id === VIRTUAL_MODULE_ID) {
        return RESOLVED_VIRTUAL_MODULE_ID
      }
    },
    load(id) {
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const code = `
const previewModules = import.meta.glob('${finalPattern}', {
  eager: true,
})

export default previewModules
`
        console.log('[React Foundry] Generated virtual module code:', code)
        return code
      }
    },
  }
}
