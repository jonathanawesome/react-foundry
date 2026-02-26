import { Preview } from '@react-foundry/ui'
import { createFileRoute } from '@tanstack/react-router'

import { getComponentById } from '../utils/route-utils'

export const Route = createFileRoute('/$componentId/demo/$demoName')({
  component: DemoComponent,
  loader: ({ params }) => {
    return {
      preview: getComponentById(params.componentId),
    }
  },
})

function DemoComponent() {
  const { preview } = Route.useLoaderData()
  const { demoName } = Route.useParams()

  return <Preview preview={preview} selectedItem={demoName} selectedType="demo" />
}
