import { ComponentLanding } from '@react-foundry/ui'
import { createFileRoute } from '@tanstack/react-router'

import { getComponentById } from '../utils/route-utils'

export const Route = createFileRoute('/$componentId/')({
  component: ComponentLandingRoute,
  loader: ({ params }) => {
    return {
      preview: getComponentById(params.componentId),
    }
  },
})

function ComponentLandingRoute() {
  const { preview } = Route.useLoaderData()
  const { componentId } = Route.useParams()

  return <ComponentLanding preview={preview} componentId={componentId} />
}
