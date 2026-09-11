import { isValidElement, type ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { createPreview, isPreview } from '../src/create-preview'
import { type ControlSchema, PREVIEW, type Preview } from '../src/types'

/** Stand-in for a rendered element; core has no React runtime to render with. */
const element = { type: 'div', props: {}, key: null } as unknown as ReactElement

/**
 * What a preview hands React: the element it returns when called as a component.
 * Core has no renderer, so the assertions read the element's `type` and `props`
 * rather than what mounting it would produce.
 */
function mounted(preview: Preview, props?: Parameters<Preview>[0]): ReactElement {
  const result = preview(props)
  if (!isValidElement(result)) throw new Error('preview did not return an element')
  return result
}

describe('createPreview', () => {
  // `render` is mounted as a component, not called: the preview returns an element
  // whose type is `render` itself, so hooks inside it get their own fiber.
  it('returns a function that mounts the bare render fn as an element', () => {
    const render = () => element
    const preview = createPreview(render)

    expect(mounted(preview).type).toBe(render)
  })

  it('returns a function that mounts the options form render fn as an element', () => {
    const render = () => element
    const preview = createPreview({ render })

    expect(mounted(preview).type).toBe(render)
  })

  // What React keys a fiber's state on. A fresh identity per call would remount
  // `render` on every re-render and drop any state held inside it.
  it('mounts the same render identity on every call', () => {
    const preview = createPreview(() => element)

    expect(mounted(preview).type).toBe(mounted(preview).type)
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

  it('forwards control values from its props to render as its props', () => {
    const preview = createPreview({
      controls: { variant: { type: 'text' } },
      render: () => element,
    })

    expect(mounted(preview, { controlValues: { variant: 'danger' } }).props).toEqual({
      variant: 'danger',
    })
  })

  // `children` as a control name is documented as fine. It is a key in the values
  // object, and `createElement` keeps a `children` key from its config when no
  // children arguments follow, so it arrives in render's props like any other.
  it('forwards a control named children like any other', () => {
    const preview = createPreview({
      controls: { children: { type: 'text' } },
      render: () => element,
    })

    expect(mounted(preview, { controlValues: { children: 'Click me' } }).props).toEqual({
      children: 'Click me',
    })
  })

  it('renders a zero-arg preview even when called with no props', () => {
    const render = () => element
    const preview = createPreview(render)

    expect(mounted(preview).type).toBe(render)
    expect(mounted(preview).props).toEqual({})
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

  // Not cosmetic. React Fast Refresh has no way to tell a component from any other
  // function, so for plain functions it falls back to testing `fn.name` against
  // /^[A-Z]/. A lowercase name fails, and the whole module stops being a refresh
  // boundary: `@vitejs/plugin-react` calls `import.meta.hot.invalidate()` instead of
  // patching, the update travels up to foundry's routes, and the page reloads. The
  // same predicate gates `registerExportsForReactRefresh`, which is what covers
  // previews written in the options form, since the static transform only registers
  // the bare-render ones.
  it.each([
    ['the bare form', createPreview(() => element)],
    ['the options form', createPreview({ render: () => element })],
  ])('names the returned function so Fast Refresh accepts it: %s', (_label, preview) => {
    expect(preview.name).toMatch(/^[A-Z]/)
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
