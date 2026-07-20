import { findLeaf, findNode, isPreview } from '@react-foundry/core'
import { ComponentLanding, Preview } from '@react-foundry/ui'
import { createFileRoute } from '@tanstack/react-router'

import { discoverNav } from '../nav'

/**
 * One splat route for the whole tree, since a nav path is arbitrarily deep.
 *
 * The path either names a preview, which renders on the canvas, or a group,
 * which renders a landing listing what sits under it.
 */
export const Route = createFileRoute('/$')({
  component: NavPathRoute,
  // Permissive: the valid params depend on which preview is loaded, so search
  // can't be a fixed schema. Coercion happens per-preview against its controls.
  // (A `retainSearchParams`/search middleware here would break the reset that
  // clears controls when you switch previews — see the panel's navigation.)
  validateSearch: (search: Record<string, unknown>) => search,
  loader: async ({ params }) => {
    const path = params._splat ?? ''
    const nav = discoverNav()
    const leaf = findLeaf(nav, path)
    const node = findNode(nav, path)

    if (!leaf) return { node, path, component: null }

    // Fetch the preview's module on demand. This dynamic import is the
    // code-split boundary: each preview is its own chunk rather than part of the
    // initial bundle. Returning the branded component in loader data is safe
    // here because this is a client-only SPA (no SSR serialization of loaders).
    const module = await leaf.load()
    const component = module[leaf.exportName]

    // The static parse and the loaded module can only disagree if a preview was
    // authored in a form the parser mis-read, so fail loudly rather than render
    // a non-preview export.
    if (!isPreview(component)) {
      throw new Error(
        `"${leaf.id}" resolved to an export that is not a preview. Author it as \`export const ${leaf.exportName} = createPreview(...)\`.`
      )
    }

    return { node, path, component }
  },
})

function NavPathRoute() {
  const { component, node, path } = Route.useLoaderData()

  if (component) return <Preview preview={component} />

  return <ComponentLanding node={node} path={path} />
}
