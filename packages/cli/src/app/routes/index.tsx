import { createFileRoute } from '@tanstack/react-router'

import { Preview } from '@react-foundry/ui'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return <Preview preview={null} selectedItem={null} selectedType={null} />
}
