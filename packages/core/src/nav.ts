import type { NavNode, PreviewLeaf } from './types'

function walk<T>(
  nodes: NavNode[],
  visit: (node: NavNode) => T | undefined
): T | undefined {
  for (const node of nodes) {
    const found = visit(node)
    if (found !== undefined) return found

    const inChildren = walk(node.children, visit)
    if (inChildren !== undefined) return inChildren
  }
}

/** Finds the preview at a full nav path, e.g. `Forms/Button/Primary`. */
export function findLeaf(nav: NavNode[], path: string): PreviewLeaf | null {
  return walk(nav, (node) => node.leaves.find((leaf) => leaf.id === path)) ?? null
}

/** Finds the group at a nav path, e.g. `Forms/Button`. */
export function findNode(nav: NavNode[], path: string): NavNode | null {
  return walk(nav, (node) => (node.path === path ? node : undefined)) ?? null
}
