import { createFileRoute } from '@tanstack/react-router'

import { Preview } from '@react-foundry/ui'

import { getComponentById } from '../utils/route-utils'

export const Route = createFileRoute('/$componentId/variant/$variantName')({
  component: VariantComponent,
  loader: ({ params }) => {
    return {
      preview: getComponentById(params.componentId),
    }
  },
})

function VariantComponent() {
  const { preview } = Route.useLoaderData()
  const { variantName } = Route.useParams()

  return (
    <Preview preview={preview} selectedItem={variantName} selectedType="variant" />
  )
}
