import type { ReactElement } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createPreview } from '../src/create-preview'
import { createDiscovery, deCamelCase, navPathFromFilename } from '../src/discovery'
import type { NavItem, NavNode, PreviewFile } from '../src/types'

const element = { type: 'div', props: {}, key: null } as unknown as ReactElement
const preview = (label?: string) =>
  label ? createPreview({ label, render: () => element }) : createPreview(() => element)

/**
 * Builds a preview file the way the Vite plugin emits one.
 *
 * `exportOrder` defaults to the key order of `previews`, but tests that care
 * about ordering pass it explicitly, since that is the whole point of the field.
 */
function previewFile(
  nav: string | undefined,
  previews: Record<string, unknown>,
  exportOrder?: string[]
): PreviewFile {
  const module: Record<string, unknown> = { ...previews }
  if (nav !== undefined) module.nav = nav

  return {
    module,
    exportOrder: exportOrder ?? [
      ...(nav !== undefined ? ['nav'] : []),
      ...Object.keys(previews),
    ],
  }
}

/** Finds a node by its full path, depth first. */
function findNode(nodes: NavNode[], path: string): NavNode | undefined {
  for (const node of nodes) {
    if (node.path === path) return node

    const found = findNode(node.children, path)
    if (found) return found
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('deCamelCase', () => {
  it.each([
    ['Primary', 'Primary'],
    ['AllSizes', 'All Sizes'],
    ['WithLongText', 'With Long Text'],
    ['RTLSupport', 'RTL Support'],
    ['XL', 'XL'],
    ['Size2Large', 'Size2 Large'],
  ])('turns %s into %s', (input, expected) => {
    expect(deCamelCase(input)).toBe(expected)
  })
})

describe('navPathFromFilename', () => {
  it('strips the preview suffix and the directory', () => {
    expect(navPathFromFilename('/proj/src/components/button.preview.tsx')).toBe('button')
  })

  it('only strips a trailing suffix', () => {
    expect(navPathFromFilename('/proj/odd.preview.tsx.preview.tsx')).toBe(
      'odd.preview.tsx'
    )
  })
})

describe('createDiscovery', () => {
  it('returns an empty tree when there are no preview files', () => {
    expect(createDiscovery({})()).toEqual([])
  })

  it('places a preview at its declared nav path', () => {
    const nav: NavItem[] = [{ label: 'Forms', children: [{ label: 'Button' }] }]
    const tree = createDiscovery(
      { '/p/button.preview.tsx': previewFile('Forms/Button', { Primary: preview() }) },
      nav
    )()

    expect(findNode(tree, 'Forms/Button')?.leaves.map((l) => l.label)).toEqual([
      'Primary',
    ])
  })

  it('nests to the depth the config declares', () => {
    const nav: NavItem[] = [
      { label: 'a', children: [{ label: 'b', children: [{ label: 'c' }] }] },
    ]
    const tree = createDiscovery(
      { '/p/x.preview.tsx': previewFile('a/b/c', { Primary: preview() }) },
      nav
    )()

    expect(tree[0].children[0].children[0].path).toBe('a/b/c')
  })

  // Config order is author intent, so it must beat alphabetical.
  it('honours config declaration order rather than sorting', () => {
    const nav: NavItem[] = [{ label: 'Zulu' }, { label: 'Alpha' }]
    const tree = createDiscovery({}, nav)()

    expect(tree.map((n) => n.label)).toEqual(['Zulu', 'Alpha'])
  })

  // The single most important assertion here: a regression to Object.keys would
  // silently reorder every preview, and an alphabetical fixture would not catch it.
  it('orders leaves by the plugin export order, not alphabetically', () => {
    const files = {
      '/p/x.preview.tsx': previewFile(
        'Forms',
        { Zulu: preview(), Alpha: preview(), Mike: preview() },
        ['nav', 'Zulu', 'Alpha', 'Mike']
      ),
    }
    const tree = createDiscovery(files, [{ label: 'Forms' }])()

    expect(tree[0].leaves.map((l) => l.exportName)).toEqual(['Zulu', 'Alpha', 'Mike'])
  })

  it('derives a label from the export name', () => {
    const tree = createDiscovery(
      { '/p/x.preview.tsx': previewFile('Forms', { AllSizes: preview() }) },
      [{ label: 'Forms' }]
    )()

    expect(tree[0].leaves[0].label).toBe('All Sizes')
  })

  it('prefers an explicit label over the derived one', () => {
    const tree = createDiscovery(
      { '/p/x.preview.tsx': previewFile('Forms', { AllSizes: preview('Every Size') }) },
      [{ label: 'Forms' }]
    )()

    expect(tree[0].leaves[0].label).toBe('Every Size')
  })

  // Labels are copy and change freely; URLs must not.
  it('builds the id from the export name even when a label overrides it', () => {
    const tree = createDiscovery(
      { '/p/x.preview.tsx': previewFile('Forms', { AllSizes: preview('Every Size') }) },
      [{ label: 'Forms' }]
    )()

    expect(tree[0].leaves[0].id).toBe('Forms/AllSizes')
  })

  // The reason createPreview brands its result at all.
  it('ignores exports that are not previews', () => {
    const files = {
      '/p/x.preview.tsx': previewFile(
        'Forms',
        {
          Primary: preview(),
          sizes: ['small', 'large'],
          helper: () => element,
          label: 'not a preview',
        },
        ['nav', 'Primary', 'sizes', 'helper', 'label']
      ),
    }
    const tree = createDiscovery(files, [{ label: 'Forms' }])()

    expect(tree[0].leaves.map((l) => l.exportName)).toEqual(['Primary'])
  })

  it('never treats the nav export as a leaf', () => {
    const tree = createDiscovery(
      { '/p/x.preview.tsx': previewFile('Forms', { Primary: preview() }) },
      [{ label: 'Forms' }]
    )()

    expect(tree[0].leaves.map((l) => l.exportName)).not.toContain('nav')
  })

  describe('undeclared paths', () => {
    it('still shows the preview rather than dropping it', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tree = createDiscovery(
        { '/p/x.preview.tsx': previewFile('Lab/Scratch', { Primary: preview() }) },
        [{ label: 'Forms' }]
      )()

      expect(findNode(tree, 'Lab/Scratch')?.leaves).toHaveLength(1)
      expect(warn).toHaveBeenCalled()
    })

    it('appends it after the declared nodes', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tree = createDiscovery(
        { '/p/x.preview.tsx': previewFile('Lab', { Primary: preview() }) },
        [{ label: 'Forms' }]
      )()

      expect(tree.map((n) => n.label)).toEqual(['Forms', 'Lab'])
    })

    it('creates missing ancestors', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {})
      const tree = createDiscovery(
        { '/p/x.preview.tsx': previewFile('a/b/c', { Primary: preview() }) },
        [{ label: 'Forms' }]
      )()

      expect(findNode(tree, 'a')).toBeDefined()
      expect(findNode(tree, 'a/b')).toBeDefined()
      expect(findNode(tree, 'a/b/c')).toBeDefined()
    })

    // With no config there is nothing to be undeclared against, so warning on
    // every preview would be noise.
    it('does not warn when no nav config was supplied at all', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
      createDiscovery({
        '/p/x.preview.tsx': previewFile('Anything', { Primary: preview() }),
      })()

      expect(warn).not.toHaveBeenCalled()
    })
  })

  it('falls back to the filename when a file declares no nav export', () => {
    const tree = createDiscovery({
      '/p/src/button.preview.tsx': previewFile(undefined, { Primary: preview() }),
    })()

    expect(tree[0].path).toBe('button')
    expect(tree[0].leaves[0].id).toBe('button/Primary')
  })

  it('merges two files that declare the same nav path', () => {
    const tree = createDiscovery(
      {
        '/p/a.preview.tsx': previewFile('Forms', { Primary: preview() }),
        '/p/b.preview.tsx': previewFile('Forms', { Secondary: preview() }),
      },
      [{ label: 'Forms' }]
    )()

    expect(tree).toHaveLength(1)
    expect(tree[0].leaves.map((l) => l.exportName)).toEqual(['Primary', 'Secondary'])
  })

  it('skips a duplicate leaf id and warns rather than silently overwriting', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const tree = createDiscovery(
      {
        '/p/a.preview.tsx': previewFile('Forms', { Primary: preview('First') }),
        '/p/b.preview.tsx': previewFile('Forms', { Primary: preview('Second') }),
      },
      [{ label: 'Forms' }]
    )()

    expect(tree[0].leaves).toHaveLength(1)
    expect(tree[0].leaves[0].label).toBe('First')
    expect(warn).toHaveBeenCalled()
  })

  it('sorts alphabetically when no nav config is declared', () => {
    const tree = createDiscovery({
      '/p/z.preview.tsx': previewFile('Zulu', { A: preview() }),
      '/p/a.preview.tsx': previewFile('Alpha', { A: preview() }),
    })()

    expect(tree.map((n) => n.label)).toEqual(['Alpha', 'Zulu'])
  })

  it('is stable regardless of the order files arrive in', () => {
    const nav: NavItem[] = [{ label: 'Forms' }]
    const a = previewFile('Forms', { Primary: preview() })
    const b = previewFile('Forms', { Secondary: preview() })

    const forward = createDiscovery(
      { '/p/a.preview.tsx': a, '/p/b.preview.tsx': b },
      nav
    )()
    const reverse = createDiscovery(
      { '/p/b.preview.tsx': b, '/p/a.preview.tsx': a },
      nav
    )()

    expect(forward[0].leaves.map((l) => l.id)).toEqual(reverse[0].leaves.map((l) => l.id))
  })

  // The root route calls this on every render.
  it('memoizes, so repeated calls do not rebuild the tree', () => {
    const discover = createDiscovery(
      { '/p/x.preview.tsx': previewFile('Forms', { Primary: preview() }) },
      [{ label: 'Forms' }]
    )

    expect(discover()).toBe(discover())
  })
})
