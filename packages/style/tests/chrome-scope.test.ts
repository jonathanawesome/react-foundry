import { afterEach, describe, expect, it } from 'vitest'

import { chromeOnly } from '../src/chrome-scope'

/**
 * The three shapes the scoping has to tell apart, in the arrangement foundry renders:
 *
 *   - a marked chrome surface and its subtree, which the resets exist for
 *   - the canvas, sitting under unmarked chrome ancestors, and the preview inside it
 *   - a popup the preview portalled onto `document.body`, where Base UI, Radix and
 *     Floating UI all mount one by default
 *
 * The portalled popup is the regression: it is a descendant of neither the canvas nor
 * the chrome, so a reset written as "not the canvas" swept it up and stripped its margin
 * and padding.
 */
function renderDocument() {
  document.body.innerHTML = `
    <aside data-foundry-chrome id="surface">
      <button id="chrome-button">Toggle</button>
    </aside>
    <div id="layout">
      <div data-foundry-canvas id="canvas">
        <button id="preview-button">Open menu</button>
      </div>
    </div>
    <div id="portal-root">
      <div id="popup"><button id="popup-button">Item</button></div>
    </div>
  `
}

/** Does the reset written for `selectors` reach `#id`? */
const isReset = (id: string, selectors: string) => {
  const el = document.getElementById(id)
  if (!el) throw new Error(`no #${id} in the test document`)

  return el.matches(chromeOnly(selectors))
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('chromeOnly', () => {
  it('reaches a marked chrome surface and its subtree', () => {
    renderDocument()

    expect(isReset('surface', '*')).toBe(true)
    expect(isReset('chrome-button', '*')).toBe(true)
    expect(isReset('chrome-button', 'button')).toBe(true)
  })

  it('never reaches the canvas or the preview inside it', () => {
    renderDocument()

    expect(isReset('canvas', '*')).toBe(false)
    expect(isReset('preview-button', '*')).toBe(false)
    expect(isReset('preview-button', 'button')).toBe(false)
  })

  // The bug: a preview's menus, popovers and tooltips render outside the canvas, so
  // "not the canvas" stripped their margin and padding while the same component was
  // fine in a real app.
  it('never reaches a popup the preview portalled out of the canvas', () => {
    renderDocument()

    expect(isReset('popup', '*')).toBe(false)
    expect(isReset('popup-button', '*')).toBe(false)
    expect(isReset('popup-button', 'button')).toBe(false)
  })

  it('leaves unmarked chrome around the canvas alone', () => {
    renderDocument()

    expect(isReset('layout', '*')).toBe(false)
  })

  // `*::before:where(…)` is invalid and would take the whole rule down with it, and a
  // dropped `box-sizing` reset is the kind of thing that only shows up in the browser.
  it('splices the scope in ahead of a pseudo-element', () => {
    expect(chromeOnly('*::before')).toBe(
      '*:where([data-foundry-chrome])::before, :where([data-foundry-chrome]) *::before'
    )
  })

  // Zero-specificity scoping: the resets must keep weighing what the bare selector
  // weighs, or `all: unset` starts beating the chrome component styles above it.
  it('adds no specificity to the selectors it scopes', () => {
    expect(chromeOnly('button')).toBe(
      'button:where([data-foundry-chrome]), :where([data-foundry-chrome]) button'
    )
  })
})
