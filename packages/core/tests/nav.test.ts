import { describe, expect, it } from 'vitest'

import { findLeaf, findNode } from '../src/nav'
import type { NavNode, Preview, PreviewLeaf } from '../src/types'

const previewFn = (() => null) as unknown as Preview

function leaf(id: string): PreviewLeaf {
  const exportName = id.split('/').pop() ?? id
  return { id, label: exportName, exportName, component: previewFn }
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
