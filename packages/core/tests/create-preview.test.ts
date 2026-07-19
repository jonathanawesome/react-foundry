import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { createPreview, isPreview } from '../src/create-preview'
import { PREVIEW } from '../src/types'

/** Stand-in for a rendered element; core has no React runtime to render with. */
const element = { type: 'div', props: {}, key: null } as unknown as ReactElement

describe('createPreview', () => {
  it('returns a function that renders what the bare render fn returns', () => {
    const preview = createPreview(() => element)

    expect(preview()).toBe(element)
  })

  it('returns a function that renders what the options form renders', () => {
    const preview = createPreview({ render: () => element })

    expect(preview()).toBe(element)
  })

  it('exposes the label from the options form', () => {
    const preview = createPreview({ label: 'Every Size', render: () => element })

    expect(preview.label).toBe('Every Size')
  })

  it('leaves the label undefined for the bare form, so discovery derives one', () => {
    const preview = createPreview(() => element)

    expect(preview.label).toBeUndefined()
  })

  it('leaves the label undefined when the options form omits it', () => {
    const preview = createPreview({ render: () => element })

    expect(preview.label).toBeUndefined()
  })

  // The wrap-don't-tag rule: `createPreview` must never touch a value the caller
  // owns, since the same render fn could be reused or exported separately.
  it('does not mutate the render function it was given', () => {
    const render = () => element
    createPreview(render)

    expect(PREVIEW in render).toBe(false)
    expect(isPreview(render)).toBe(false)
  })

  it('returns a new function rather than the one passed in', () => {
    const render = () => element

    expect(createPreview(render)).not.toBe(render)
  })
})

describe('isPreview', () => {
  it('is true for the bare form', () => {
    expect(isPreview(createPreview(() => element))).toBe(true)
  })

  it('is true for the options form', () => {
    expect(isPreview(createPreview({ render: () => element }))).toBe(true)
  })

  // This is the guard that keeps helpers, fixtures, and constants exported from
  // a .preview.tsx file out of the nav tree.
  it.each([
    ['a plain function', () => element],
    ['a function declaration', function helper() {}],
    ['null', null],
    ['undefined', undefined],
    ['a string', 'Primary'],
    ['a number', 42],
    ['an array', ['small', 'medium', 'large']],
    ['an object', { label: 'Primary', render: () => element }],
  ])('is false for %s', (_label, value) => {
    expect(isPreview(value)).toBe(false)
  })
})
