import { createRoute, Preview } from '@react-foundry/ui'

import { rootRoute } from './root-route'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
})

function IndexComponent() {
  return <Preview preview={null} />
}
