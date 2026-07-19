import type { NavNode } from '@react-foundry/core'
import { Link, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'
import { useUIStore } from '../state'
import { Icon } from './icon/icon'

import { shelfStyles } from './shelf.css'

interface ShelfProps {
  nav: NavNode[]
}

/** Every ancestor path of a leaf id, so the tree can open down to the active item. */
export function ancestorPaths(leafId: string): string[] {
  const segments = leafId.split('/')

  // Drop the last segment: that is the export name, not a node.
  return segments.slice(0, -1).map((_, index) => segments.slice(0, index + 1).join('/'))
}

/**
 * Tracks which nodes are open.
 *
 * Keyed by node path rather than a synthetic id so it survives the tree being
 * rebuilt, and so auto-expanding an ancestor is a plain path lookup. Held in the
 * persisted store because editing a preview file reloads the page, and losing
 * the whole tree's open state on every save is worse than the edit is worth.
 */
function useExpandState(activeLeafId: string | null) {
  const expandedNodes = useUIStore.use.expandedNodes()
  const toggle = useUIStore.use.toggleNode()
  const expandNodes = useUIStore.use.expandNodes()

  useEffect(() => {
    if (!activeLeafId) return

    // Open every ancestor, not just the immediate parent, or a deeply nested
    // active leaf stays hidden.
    expandNodes(ancestorPaths(activeLeafId))
  }, [activeLeafId, expandNodes])

  return { isExpanded: (path: string) => expandedNodes.includes(path), toggle }
}

interface NavTreeProps {
  nodes: NavNode[]
  activeLeafId: string | null
  isExpanded: (path: string) => boolean
  toggle: (path: string) => void
  depth: number
}

/**
 * Renders the nav tree to arbitrary depth.
 *
 * One recursive component replaces the old fixed category, component, and
 * variants/demos levels, which could only ever express three.
 */
const NavTree = ({ nodes, activeLeafId, isExpanded, toggle, depth }: NavTreeProps) => (
  <ul className={shelfStyles.nodeList} data-depth={depth}>
    {nodes.map((node) => {
      const expanded = isExpanded(node.path)

      return (
        <li key={node.path} className={shelfStyles.node}>
          <button
            type="button"
            className={shelfStyles.nodeHeader}
            onClick={() => toggle(node.path)}
            data-expanded={expanded}
          >
            <Icon name="CaretRight" rotate={expanded ? '90' : undefined} size="sm" />
            {node.label}
          </button>

          {expanded && (
            <>
              {node.leaves.length > 0 && (
                <ul className={shelfStyles.leafList}>
                  {node.leaves.map((leaf) => (
                    <li key={leaf.id}>
                      <Link
                        to="/$"
                        params={{ _splat: leaf.id }}
                        className={shelfStyles.leafLink}
                        data-active={activeLeafId === leaf.id}
                      >
                        {leaf.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {node.children.length > 0 && (
                <NavTree
                  nodes={node.children}
                  activeLeafId={activeLeafId}
                  isExpanded={isExpanded}
                  toggle={toggle}
                  depth={depth + 1}
                />
              )}
            </>
          )}
        </li>
      )
    })}
  </ul>
)

export const Shelf = ({ nav }: ShelfProps) => {
  const isShelfOpen = useUIStore.use.isShelfOpen()

  const params = useParams({ strict: false })
  const activeLeafId = '_splat' in params ? ((params._splat as string) ?? null) : null

  const { isExpanded, toggle } = useExpandState(activeLeafId)

  return (
    <aside className={shelfStyles.shelf} data-open={isShelfOpen}>
      <div className={shelfStyles.content}>
        <nav className={shelfStyles.sidebar}>
          <NavTree
            nodes={nav}
            activeLeafId={activeLeafId}
            isExpanded={isExpanded}
            toggle={toggle}
            depth={0}
          />
        </nav>
      </div>
    </aside>
  )
}
