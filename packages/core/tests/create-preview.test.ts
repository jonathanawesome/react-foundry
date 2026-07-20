import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { createPreview, isPreview } from '../src/create-preview'
import { type ControlSchema, PREVIEW } from '../src/types'

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

  it('exposes the controls schema from the options form', () => {
    const controls: ControlSchema = {
      variant: { type: 'select', options: ['a', 'b'] },
    }
    const preview = createPreview({ controls, render: () => element })

    expect(preview.controls).toBe(controls)
  })

  it('leaves controls undefined for the bare form', () => {
    expect(createPreview(() => element).controls).toBeUndefined()
  })

  it('forwards control values from its props to render', () => {
    const seen: unknown[] = []
    const preview = createPreview({
      controls: { variant: { type: 'text' } },
      render: (v) => {
        seen.push(v)
        return element
      },
    })

    preview({ controlValues: { variant: 'danger' } })

    expect(seen).toEqual([{ variant: 'danger' }])
  })

  it('renders a zero-arg preview even when called with no props', () => {
    const preview = createPreview(() => element)

    expect(preview()).toBe(element)
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

  // React components may return any ReactNode, so previews should too.
  it.each([
    ['an array', () => [element, element]],
    ['a string', () => 'text'],
    ['a number', () => 42],
    ['null', () => null],
  ])('accepts a render returning %s', (_label, render) => {
    expect(isPreview(createPreview(render))).toBe(true)
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
