import { findLeaf, findNode } from '@react-foundry/core'
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
  loader: ({ params }) => {
    const path = params._splat ?? ''
    const nav = discoverNav()

    return { leaf: findLeaf(nav, path), node: findNode(nav, path), path }
  },
})

function NavPathRoute() {
  const { leaf, node, path } = Route.useLoaderData()

  if (leaf) return <Preview preview={leaf.component} />

  return <ComponentLanding node={node} path={path} />
}
