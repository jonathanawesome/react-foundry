import { describe, expect, it } from 'vitest'

import { collectNodePaths, findLeaf, findNode } from '../src/nav'
import type { NavNode, PreviewLeaf } from '../src/types'

const load = async () => ({})

function leaf(id: string): PreviewLeaf {
  const exportName = id.split('/').pop() ?? id
  return { id, label: exportName, exportName, load }
}

function node(
  path: string,
  { leaves = [], children = [] }: { leaves?: PreviewLeaf[]; children?: NavNode[] } = {}
): NavNode {
  return { label: path.split('/').pop() ?? path, path, children, leaves }
}

const tree: NavNode[] = [
  node('Forms', {
    leaves: [leaf('Forms/Overview')],
    children: [
      node('Forms/Button', {
        leaves: [leaf('Forms/Button/Primary'), leaf('Forms/Button/Danger')],
      }),
    ],
  }),
  node('Layout', { leaves: [leaf('Layout/Stack')] }),
]

describe('findLeaf', () => {
  it('finds a leaf nested several levels deep', () => {
    expect(findLeaf(tree, 'Forms/Button/Primary')?.exportName).toBe('Primary')
  })

  it('finds a leaf sitting directly on a group', () => {
    expect(findLeaf(tree, 'Forms/Overview')?.exportName).toBe('Overview')
  })

  it('returns null for an unknown path', () => {
    expect(findLeaf(tree, 'Forms/Button/Nope')).toBeNull()
  })

  // The route passes '' when the splat is empty.
  it('returns null for an empty path', () => {
    expect(findLeaf(tree, '')).toBeNull()
  })

  // A group path is not a preview, which is what sends the route to the landing.
  it('returns null for a path that names a group', () => {
    expect(findLeaf(tree, 'Forms/Button')).toBeNull()
  })

  it('returns null for an empty tree', () => {
    expect(findLeaf([], 'Forms')).toBeNull()
  })
})

describe('findNode', () => {
  it('finds a top level node', () => {
    expect(findNode(tree, 'Forms')?.label).toBe('Forms')
  })

  it('finds a nested node', () => {
    expect(findNode(tree, 'Forms/Button')?.label).toBe('Button')
  })

  it('returns null for an unknown path', () => {
    expect(findNode(tree, 'Nope')).toBeNull()
  })

  it('returns null for an empty path', () => {
    expect(findNode(tree, '')).toBeNull()
  })

  it('returns null for a path that names a leaf', () => {
    expect(findNode(tree, 'Forms/Button/Primary')).toBeNull()
  })

  it('returns the node with its leaves and children intact', () => {
    const found = findNode(tree, 'Forms')

    expect(found?.leaves).toHaveLength(1)
    expect(found?.children).toHaveLength(1)
  })
})

describe('collectNodePaths', () => {
  it('collects every node at every depth, parents before their children', () => {
    expect(collectNodePaths(tree)).toEqual(['Forms', 'Forms/Button', 'Layout'])
  })

  // A leaf cannot be expanded, so counting its id as a valid path would let
  // stale expansion entries survive a prune.
  it('leaves out leaf ids', () => {
    expect(collectNodePaths(tree)).not.toContain('Forms/Button/Primary')
  })

  it('returns nothing for an empty tree', () => {
    expect(collectNodePaths([])).toEqual([])
  })
})
