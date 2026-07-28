import { afterEach, describe, expect, it } from 'vitest'

import { resolveTarget, selectorOf } from '../src/components/a11y-scan'

describe('selectorOf', () => {
  it('flattens an iframe or shadow path into one stable key', () => {
    expect(selectorOf(['.a'])).toBe('.a')
    expect(selectorOf([['#frame', '.a']])).toBe('#frame > .a')
  })
})

describe('resolveTarget', () => {
  let root: HTMLDivElement

  function mount(html: string) {
    document.body.innerHTML = `<div id="root">${html}</div><div id="outside"></div>`
    root = document.querySelector('#root') as HTMLDivElement
  }

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('resolves a flat selector inside the root', () => {
    mount('<p class="target">hi</p>')

    expect(resolveTarget(['.target'], root)).toBe(root.querySelector('.target'))
  })

  it('falls back to the last segment of a nested path', () => {
    mount('<p class="inner">hi</p>')

    expect(resolveTarget([['#frame', '.inner']], root)).toBe(root.querySelector('.inner'))
  })

  // The guard that stops a stale selector from highlighting foundry's own chrome.
  it('returns null for an element outside the root', () => {
    mount('<p class="target">hi</p>')

    expect(resolveTarget(['#outside'], root)).toBeNull()
  })

  it('returns null when the target cannot be resolved', () => {
    mount('<p class="target">hi</p>')

    expect(resolveTarget(['.missing'], root)).toBeNull()
    expect(resolveTarget(['>>bad'], root)).toBeNull()
    expect(resolveTarget([], root)).toBeNull()
    expect(resolveTarget(['.target'], null)).toBeNull()
  })
})
