import type { Plugin } from 'vite'

import type { FoundryConfig } from '../types'

const VIRTUAL_ID = 'virtual:react-foundry-config'
const RESOLVED_ID = '\0' + VIRTUAL_ID

export function createConfigVirtualModulePlugin(
  theme: FoundryConfig['theme']
): Plugin {
  const themeColors = {
    dark: theme?.colors?.dark ?? {},
    light: theme?.colors?.light ?? {},
  }

  return {
    name: 'react-foundry:virtual-config',
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export const themeColors = ${JSON.stringify(themeColors)};`
      }
    },
  }
}
