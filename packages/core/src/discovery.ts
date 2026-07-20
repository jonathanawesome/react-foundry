import type { NavItem, NavNode, PreviewFile, PreviewLeaf } from './types'

/**
 * Surfaces a discovery problem to the author without failing the build.
 *
 * Previews that cannot be placed still render, just not where they meant, so a
 * warning beats an exception here.
 */
// biome-ignore lint/suspicious/noConsole: these diagnostics are the point
const warn = (message: string) => console.warn(`[react-foundry] ${message}`)

/**
 * Turns an export name into a display label.
 *
 * `AllSizes` becomes `All Sizes`, `WithLongText` becomes `With Long Text`, and
 * runs of capitals survive intact so `RTLSupport` becomes `RTL Support`.
 */
export function deCamelCase(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
}

/**
 * Fallback position for a file with no `nav` export, derived from its filename.
 *
 * Deliberately flat: guessing a hierarchy from a path would be wrong as often
 * as right, and an unplaced preview is easier to notice at the top level.
 */
export function navPathFromFilename(filePath: string): string {
  const fileName = filePath.split('/').pop() ?? filePath

  return fileName.replace(/\.preview\.tsx$/, '')
}

function createNode(label: string, path: string): NavNode {
  return { label, path, children: [], leaves: [] }
}

/** Builds the declared skeleton, recording every node by path as it goes. */
function buildSkeleton(
  items: NavItem[],
  index: Map<string, NavNode>,
  prefix = ''
): NavNode[] {
  return items.flatMap((item) => {
    if (item.label.includes('/')) {
      warn(
        `Nav label "${item.label}" contains a slash, which separates path segments. Use nested children instead.`
      )
    }

    const path = prefix ? `${prefix}/${item.label}` : item.label
    const existing = index.get(path)

    // Two siblings sharing a label would both render while only the last could
    // receive previews, leaving the first permanently empty. Merge instead.
    if (existing) {
      warn(`Nav path "${path}" is declared more than once. Merging the duplicates.`)
      existing.children.push(...buildSkeleton(item.children ?? [], index, path))
      return []
    }

    const node = createNode(item.label, path)

    index.set(path, node)
    node.children = buildSkeleton(item.children ?? [], index, path)

    return [node]
  })
}

/**
 * Finds the node at `path`, creating it and any missing ancestors.
 *
 * Used for paths the config never declared, so they surface at the end of the
 * tree rather than vanishing.
 */
function ensureNode(
  path: string,
  index: Map<string, NavNode>,
  roots: NavNode[]
): NavNode {
  const existing = index.get(path)
  if (existing) return existing

  const segments = path.split('/')
  const label = segments[segments.length - 1]
  const node = createNode(label, path)

  index.set(path, node)

  if (segments.length === 1) {
    roots.push(node)
  } else {
    const parentPath = segments.slice(0, -1).join('/')
    ensureNode(parentPath, index, roots).children.push(node)
  }

  return node
}

function sortTree(nodes: NavNode[]): NavNode[] {
  nodes.sort((a, b) => a.label.localeCompare(b.label))
  for (const node of nodes) sortTree(node.children)

  return nodes
}

/**
 * Reads previews out of one file, in the order they were written.
 *
 * The list comes straight from the file's statically parsed metadata, so no
 * preview module is evaluated here: that is what keeps each preview in its own
 * lazy chunk. Non-preview exports (helpers, fixtures, the `nav` export) were
 * already filtered out during the static parse.
 */
function collectLeaves(navPath: string, file: PreviewFile): PreviewLeaf[] {
  return file.previews.map(({ exportName, label }) => ({
    // The export name, never the label: renaming a label must not break a link,
    // and export names are already identifier-safe.
    id: `${navPath}/${exportName}`,
    label: label ?? deCamelCase(exportName),
    exportName,
    load: file.load,
  }))
}

/**
 * Builds the navigation tree from discovered preview files.
 *
 * The declared `nav` config supplies both the shape and the order. Paths that
 * are not declared still appear, appended at the end with a warning, so an
 * undeclared preview is never silently dropped.
 */
export function createDiscovery(
  previewModules: Record<string, PreviewFile>,
  navConfig: NavItem[] = []
) {
  let cache: NavNode[] | null = null

  return function discoverNav(): NavNode[] {
    // The root route calls this on every render, so build once.
    if (cache) return cache

    const index = new Map<string, NavNode>()
    const roots = buildSkeleton(navConfig, index)
    const isDeclared = navConfig.length > 0
    const seenLeafIds = new Set<string>()

    // Sort by file path so the tree is stable regardless of glob order.
    const files = Object.entries(previewModules).sort(([a], [b]) => a.localeCompare(b))

    for (const [filePath, file] of files) {
      const navPath = file.nav || navPathFromFilename(filePath)

      if (isDeclared && !index.has(navPath)) {
        warn(
          `"${navPath}" is not declared in your nav config, so it was added at the end of the tree. Declare it to control where it sits.`
        )
      }

      const node = ensureNode(navPath, index, roots)

      for (const leaf of collectLeaves(navPath, file)) {
        if (seenLeafIds.has(leaf.id)) {
          warn(
            `Duplicate preview "${leaf.id}" from ${filePath} was skipped. Two files share a nav path and an export name.`
          )
          continue
        }

        seenLeafIds.add(leaf.id)
        node.leaves.push(leaf)
      }
    }

    // With nothing declared there is no author-supplied order to respect, so
    // fall back to something predictable.
    cache = isDeclared ? roots : sortTree(roots)

    return cache
  }
}
