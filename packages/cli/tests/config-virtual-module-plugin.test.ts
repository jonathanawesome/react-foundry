import { describe, expect, it } from 'vitest'

import { createConfigVirtualModulePlugin } from '../src/vite/config-virtual-module-plugin'

const RESOLVED_ID = '\0virtual:react-foundry-config'

describe('createConfigVirtualModulePlugin', () => {
  it('resolves the virtual module ID', () => {
    const plugin = createConfigVirtualModulePlugin(undefined)
    expect(plugin.resolveId?.('virtual:react-foundry-config', undefined, {})).toBe(
      RESOLVED_ID
    )
    expect(plugin.resolveId?.('something-else', undefined, {})).toBeUndefined()
  })

  it('emits empty dark/light objects when no theme provided', () => {
    const plugin = createConfigVirtualModulePlugin(undefined)
    const code = plugin.load?.(RESOLVED_ID, {})
    expect(code).toBe('export const themeColors = {"dark":{},"light":{}};')
  })

  it('serializes dark color overrides', () => {
    const plugin = createConfigVirtualModulePlugin({
      colors: { dark: { brand: '#0ea5e9', bg: 'oklch(10% 0 0)' } },
    })
    const code = plugin.load?.(RESOLVED_ID, {}) as string
    expect(code).toContain('"dark":{"brand":"#0ea5e9","bg":"oklch(10% 0 0)"}')
    expect(code).toContain('"light":{}')
  })

  it('serializes light color overrides', () => {
    const plugin = createConfigVirtualModulePlugin({
      colors: { light: { surface: 'oklch(99% 0 0)' } },
    })
    const code = plugin.load?.(RESOLVED_ID, {}) as string
    expect(code).toContain('"light":{"surface":"oklch(99% 0 0)"}')
    expect(code).toContain('"dark":{}')
  })

  it('does not load unrelated module IDs', () => {
    const plugin = createConfigVirtualModulePlugin(undefined)
    expect(plugin.load?.('\0something-else', {})).toBeUndefined()
  })
})
