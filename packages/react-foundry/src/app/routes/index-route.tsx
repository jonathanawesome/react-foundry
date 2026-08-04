import { Preview } from '@react-foundry/ui'
import { createRoute } from '@tanstack/react-router'

import { rootRoute } from './root-route'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
})

function IndexComponent() {
  return <Preview preview={null} />
}
