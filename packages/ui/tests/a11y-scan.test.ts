import type { NodeResult } from 'axe-core'
import { afterEach, describe, expect, it } from 'vitest'

import {
  mergeByMode,
  resolveTarget,
  type ScanMode,
  selectorOf,
  type Violation,
  waitForThemeToSettle,
  withoutModes,
} from '../src/components/a11y-scan'

function node(target: NodeResult['target']): NodeResult {
  return { html: '<p></p>', target, any: [], all: [], none: [] }
}

function violation(id: string, nodes: NodeResult[]): Violation {
  return {
    id,
    impact: 'serious',
    description: `${id} description`,
    help: `${id} help`,
    helpUrl: `https://dequeuniversity.com/rules/axe/4.11/${id}`,
    nodes,
  }
}

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

describe('withoutModes', () => {
  it('leaves every node untagged, so a single-mode scan shows no badges', () => {
    const merged = withoutModes([violation('color-contrast', [node(['.a'])])])

    expect(merged[0].nodes[0].modes).toBeNull()
  })
})

describe('mergeByMode', () => {
  const contrast = 'color-contrast'

  // Asserted both ways round: the tag order must not depend on which theme was active
  // when the scan started.
  it('tags a node found in both passes with both modes', () => {
    const both = (first: ScanMode, secondMode: ScanMode) =>
      mergeByMode(
        [violation(contrast, [node(['.a'])])],
        first,
        [violation(contrast, [node(['.a'])])],
        secondMode
      )[0].nodes[0].modes

    expect(both('light', 'dark')).toEqual(['light', 'dark'])
    expect(both('dark', 'light')).toEqual(['light', 'dark'])
  })

  it('tags a node only one pass found with that mode alone', () => {
    const merged = mergeByMode(
      [violation(contrast, [node(['.a'])])],
      'light',
      [violation(contrast, [node(['.b'])])],
      'dark'
    )
    const bySelector = Object.fromEntries(
      merged[0].nodes.map((n) => [selectorOf(n.target), n.modes])
    )

    expect(bySelector).toEqual({ '.a': ['light'], '.b': ['dark'] })
  })

  it('carries over a rule that only fails in the second mode', () => {
    const merged = mergeByMode([], 'light', [violation(contrast, [node(['.a'])])], 'dark')

    expect(merged).toHaveLength(1)
    expect(merged[0].nodes[0].modes).toEqual(['dark'])
  })

  it('leaves a theme-invariant rule untagged', () => {
    const merged = mergeByMode(
      [violation('image-alt', [node(['.a'])]), violation(contrast, [node(['.b'])])],
      'light',
      [violation(contrast, [node(['.b'])])],
      'dark'
    )

    expect(merged[0].nodes[0].modes).toBeNull()
    expect(merged[1].nodes[0].modes).toEqual(['light', 'dark'])
  })

  it('matches nodes across passes by flattened selector, not array identity', () => {
    const merged = mergeByMode(
      [violation(contrast, [node([['#frame', '.a']])])],
      'light',
      [violation(contrast, [node([['#frame', '.a']])])],
      'dark'
    )

    expect(merged[0].nodes).toHaveLength(1)
    expect(merged[0].nodes[0].modes).toEqual(['light', 'dark'])
  })
})

// jsdom has no layout and no theme to flip, so the signature never changes and the budget
// is what ends the wait. The point is that it ends rather than hanging.
describe('waitForThemeToSettle', () => {
  it('gives up at the budget when nothing ever changes', async () => {
    const root = document.createElement('div')
    document.body.appendChild(root)
    const started = Date.now()

    await waitForThemeToSettle(root, 50)

    expect(Date.now() - started).toBeGreaterThanOrEqual(50)
    document.body.removeChild(root)
  })

  it('resolves immediately without a root', async () => {
    await expect(waitForThemeToSettle(null, 50)).resolves.toBeUndefined()
  })
})
