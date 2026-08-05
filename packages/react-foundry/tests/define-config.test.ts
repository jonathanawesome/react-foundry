import { describe, expect, it } from 'vitest'

import { defineConfig, defineNav } from '../src/config/define-config'

describe('defineConfig', () => {
  it('returns the same config object (identity function)', () => {
    const config = { previews: 'src/**/*.preview.tsx', port: 3000 }
    const result = defineConfig(config)
    expect(result).toBe(config)
  })

  it('passes through theme config unchanged', () => {
    const config = defineConfig({
      theme: {
        colors: {
          dark: { accent: '50% 0.3 270' },
          light: { accent: '80% 0.2 270' },
        },
      },
    })
    expect(config.theme?.colors?.dark?.accent).toBe('50% 0.3 270')
    expect(config.theme?.colors?.light?.accent).toBe('80% 0.2 270')
  })

  it('handles an empty config', () => {
    const config = defineConfig({})
    expect(config).toEqual({})
  })
})

describe('defineNav', () => {
  it('returns the same tree (identity function)', () => {
    const nav = [{ label: 'Forms', children: [{ label: 'Button' }] }] as const
    expect(defineNav(nav)).toBe(nav)
  })

  // It exists for its type, not its runtime: the `const` type parameter keeps the labels
  // literal so NavPathsOf can flatten them. The union itself is asserted in core's
  // types.test-d.ts, and apps/theme-warm exercises the whole path end to end.
  it('passes a nested tree through unchanged', () => {
    const nav = defineNav([
      { label: 'a', children: [{ label: 'b', children: [{ label: 'c' }] }] },
    ])

    expect(nav[0]?.children?.[0]?.children?.[0]?.label).toBe('c')
  })
})
