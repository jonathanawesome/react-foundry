import { collectNodePaths, type NavNode } from '@react-foundry/core'
import { chromeSurfaceProps } from '@react-foundry/style'
import { Link, useParams } from '@tanstack/react-router'
import { type RefObject, useEffect, useRef } from 'react'
import { useUIStore } from '../../state'
import { Icon } from '../icon/icon'
import { IconButton } from '../icon-button/icon-button'
import { Scrollable } from '../scrollable/scrollable'
import { Tooltip } from '../tooltip/tooltip'

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
function useExpandState(nav: NavNode[], activeLeafId: string | null) {
  const expandedNodes = useUIStore.use.expandedNodes()
  const toggle = useUIStore.use.toggleNode()
  const expandNodes = useUIStore.use.expandNodes()
  const prune = useUIStore.use.pruneNodes()
  const collapseTo = useUIStore.use.collapseNodesTo()

  useEffect(() => {
    // Paths are persisted, so renaming or deleting a folder strands an entry
    // that nothing will ever match or remove again. Reconcile against the live
    // tree, the only thing that knows the current names. An empty tree means
    // nothing has been discovered yet far more often than it means every
    // preview was deleted, so leave the list alone rather than wiping it.
    if (nav.length === 0) return

    prune(collectNodePaths(nav))
  }, [nav, prune])

  useEffect(() => {
    if (!activeLeafId) return

    // Open every ancestor, not just the immediate parent, or a deeply nested
    // active leaf stays hidden.
    expandNodes(ancestorPaths(activeLeafId))
  }, [activeLeafId, expandNodes])

  return {
    expandedNodes,
    isExpanded: (path: string) => expandedNodes.includes(path),
    toggle,
    // Nothing else ever closes a node, so a long session leaves the tree too
    // tall to find anything in. This folds it back to the path to the active
    // item, or to nothing at all when no preview is open.
    collapseOthers: () => collapseTo(activeLeafId ? ancestorPaths(activeLeafId) : []),
  }
}

/**
 * Brings the active leaf into view once per navigation.
 *
 * A reload resets the shelf's scroll to the top, and in a long tree the active
 * item is then somewhere below the fold with nothing pointing at it. Centered
 * rather than nudged to the nearest edge, so its neighbors come with it.
 *
 * The scroll position is set directly instead of through `scrollIntoView`,
 * which would also scroll every other scrollable ancestor it can find. The
 * shelf's stylesheet is what makes the move smooth, except for the first one
 * after a load: editing a preview file reloads the page, and watching the tree
 * glide back into place on every save gets old.
 */
function useScrollToActive(
  navRef: RefObject<HTMLElement | null>,
  nav: NavNode[],
  activeLeafId: string | null,
  expandedNodes: string[]
) {
  const scrolledFor = useRef<string | null>(null)
  const isFirstPass = useRef(true)

  // `nav` and `expandedNodes` are here because the link may not exist on the
  // first pass: the tree can arrive late, and its ancestors open in an effect.
  // The guard below is what stops them scrolling again on every later toggle,
  // which would yank the tree away from whatever folder was just clicked.
  useEffect(() => {
    if (!activeLeafId) {
      // Loaded with no preview open, so whatever comes next is a navigation.
      isFirstPass.current = false
      scrolledFor.current = null
      return
    }

    if (scrolledFor.current === activeLeafId) return

    // The nav's parent is the Scrollable, the element that actually scrolls.
    const container = navRef.current?.parentElement
    const link = navRef.current?.querySelector('[data-active="true"]')
    if (!container || !link) return

    scrolledFor.current = activeLeafId

    // `auto` defers to the stylesheet, which is smooth unless the user has
    // asked for reduced motion.
    const behavior = isFirstPass.current ? 'instant' : 'auto'
    isFirstPass.current = false

    const view = container.getBoundingClientRect()
    const target = link.getBoundingClientRect()

    // Already on screen, as when the leaf was just clicked: leave it be.
    if (target.top >= view.top && target.bottom <= view.bottom) return

    const offset = target.top - view.top - (view.height - target.height) / 2

    container.scrollTo({ top: container.scrollTop + offset, behavior })
  }, [navRef, nav, activeLeafId, expandedNodes])
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

  const { expandedNodes, isExpanded, toggle, collapseOthers } = useExpandState(
    nav,
    activeLeafId
  )

  const navRef = useRef<HTMLElement>(null)
  useScrollToActive(navRef, nav, activeLeafId, expandedNodes)

  return (
    <aside {...chromeSurfaceProps(shelfStyles.shelf)} data-open={isShelfOpen}>
      {/* An empty tree has nothing to fold. */}
      {nav.length > 0 && (
        <div className={shelfStyles.collapse}>
          <Tooltip label="Collapse Others">
            <IconButton
              icon="ArrowsInLineVertical"
              onClick={collapseOthers}
              title="Collapse Others"
              nativeTooltip={false}
            />
          </Tooltip>
        </div>
      )}

      <Scrollable className={shelfStyles.content}>
        <nav ref={navRef} className={shelfStyles.sidebar}>
          <NavTree
            nodes={nav}
            activeLeafId={activeLeafId}
            isExpanded={isExpanded}
            toggle={toggle}
            depth={0}
          />
        </nav>
      </Scrollable>
    </aside>
  )
}
