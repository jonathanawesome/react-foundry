import { describe, expect, it } from 'vitest'

import { defineConfig } from '../src/config/define-config'

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
