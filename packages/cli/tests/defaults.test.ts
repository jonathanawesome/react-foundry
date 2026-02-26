import { describe, expect, it } from 'vitest'

import { DEFAULT_CONFIG } from '../src/config/defaults'

describe('DEFAULT_CONFIG', () => {
  it('has expected default values', () => {
    expect(DEFAULT_CONFIG.previews).toBe('src/components/**/*.preview.tsx')
    expect(DEFAULT_CONFIG.port).toBe(5173)
    expect(DEFAULT_CONFIG.host).toBe('localhost')
  })

  it('does not include optional keys', () => {
    const keys = Object.keys(DEFAULT_CONFIG)
    expect(keys).not.toContain('viteConfig')
    expect(keys).not.toContain('theme')
    expect(keys).not.toContain('title')
  })
})
