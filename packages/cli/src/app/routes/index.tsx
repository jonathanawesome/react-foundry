import { Preview } from '@react-foundry/ui'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return <Preview preview={null} selectedItem={null} selectedType={null} />
}
