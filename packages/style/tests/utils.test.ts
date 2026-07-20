import { describe, expect, it } from 'vitest'

import {
  arrayToKebabString,
  colorWithAlpha,
  isRawOklchTriplet,
  transformColors,
} from '../src/utils'

describe('arrayToKebabString', () => {
  it('joins segments with a leading hyphen', () => {
    expect(arrayToKebabString(['colors', 'panel'])).toBe('-colors-panel')
    expect(arrayToKebabString(['px', '12'])).toBe('-px-12')
  })

  it('kebab-cases camelCase segments so var names stay hyphenated', () => {
    expect(arrayToKebabString(['colors', 'textMuted'])).toBe('-colors-text-muted')
    expect(arrayToKebabString(['colors', 'statusCritical'])).toBe(
      '-colors-status-critical'
    )
  })
})

describe('isRawOklchTriplet', () => {
  it('recognizes standard OKLCH triplets', () => {
    expect(isRawOklchTriplet('62.1% 0.289482 350.9')).toBe(true)
    expect(isRawOklchTriplet('14.6% 0 0')).toBe(true)
    expect(isRawOklchTriplet('97.7% 0 0')).toBe(true)
    expect(isRawOklchTriplet('90% 0.002575 15.9')).toBe(true)
  })

  it('handles whitespace', () => {
    expect(isRawOklchTriplet('  62.1% 0.289482 350.9  ')).toBe(true)
  })

  it('rejects hex colors', () => {
    expect(isRawOklchTriplet('#ff0000')).toBe(false)
    expect(isRawOklchTriplet('#333')).toBe(false)
  })

  it('rejects named colors', () => {
    expect(isRawOklchTriplet('red')).toBe(false)
    expect(isRawOklchTriplet('rebeccapurple')).toBe(false)
  })

  it('rejects functional notation', () => {
    expect(isRawOklchTriplet('oklch(62.1% 0.289482 350.9)')).toBe(false)
    expect(isRawOklchTriplet('rgb(255, 0, 0)')).toBe(false)
    expect(isRawOklchTriplet('hsl(0, 100%, 50%)')).toBe(false)
  })
})

describe('transformColors', () => {
  it('wraps raw OKLCH triplets in oklch()', () => {
    const result = transformColors({ brand: '62.1% 0.289482 350.9' })
    expect(result.brand).toBe('oklch(62.1% 0.289482 350.9)')
  })

  it('passes through hex colors unchanged', () => {
    const result = transformColors({ brand: '#ff0000' })
    expect(result.brand).toBe('#ff0000')
  })

  it('passes through named colors unchanged', () => {
    const result = transformColors({ brand: 'red' })
    expect(result.brand).toBe('red')
  })

  it('passes through oklch functional notation unchanged', () => {
    const result = transformColors({ brand: 'oklch(62.1% 0.289482 350.9)' })
    expect(result.brand).toBe('oklch(62.1% 0.289482 350.9)')
  })

  it('passes through rgb() unchanged', () => {
    const result = transformColors({ brand: 'rgb(255, 0, 0)' })
    expect(result.brand).toBe('rgb(255, 0, 0)')
  })

  it('handles mixed formats in the same object', () => {
    const result = transformColors({
      neutral1: '14.6% 0 0',
      brand: '#0ea5e9',
      accent: 'oklch(70% 0.15 200)',
    })
    expect(result.neutral1).toBe('oklch(14.6% 0 0)')
    expect(result.brand).toBe('#0ea5e9')
    expect(result.accent).toBe('oklch(70% 0.15 200)')
  })
})

describe('colorWithAlpha', () => {
  it('uses oklch() alpha syntax for raw triplets', () => {
    expect(colorWithAlpha('30.1% 0 0', 0.45)).toBe('oklch(30.1% 0 0 / 0.45)')
  })

  it('uses color-mix() for hex colors', () => {
    expect(colorWithAlpha('#333', 0.45)).toBe(
      'color-mix(in oklab, #333 45%, transparent)'
    )
  })

  it('uses color-mix() for named colors', () => {
    expect(colorWithAlpha('red', 0.2)).toBe('color-mix(in oklab, red 20%, transparent)')
  })

  it('uses color-mix() for functional notation', () => {
    expect(colorWithAlpha('oklch(62.1% 0.289482 350.9)', 0.35)).toBe(
      'color-mix(in oklab, oklch(62.1% 0.289482 350.9) 35%, transparent)'
    )
  })
})
