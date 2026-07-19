import { ComponentLanding, Preview } from '@react-foundry/ui'
import { createFileRoute } from '@tanstack/react-router'

import { getLeafByPath, getNodeByPath } from '../utils/route-utils'

/**
 * One splat route for the whole tree.
 *
 * A nav path is arbitrarily deep, so it cannot be expressed as fixed params.
 * The path either names a preview, which renders on the canvas, or a group,
 * which renders a landing listing what sits under it.
 */
export const Route = createFileRoute('/$')({
  component: NavPathRoute,
  loader: ({ params }) => {
    const path = params._splat ?? ''

    return { leaf: getLeafByPath(path), node: getNodeByPath(path), path }
  },
})

function NavPathRoute() {
  const { leaf, node, path } = Route.useLoaderData()

  if (leaf) return <Preview preview={leaf.component} />

  return <ComponentLanding node={node} path={path} />
}
