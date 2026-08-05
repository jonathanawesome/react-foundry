import { Provider } from 'virtual:react-foundry-providers'
import { createRoute, Preview } from '@react-foundry/ui'

import { rootRoute } from './root-route'

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexComponent,
})

// Passes `Provider` even with nothing to render: Preview mounts it on the empty canvas
// too, so a consumer's design system does its document-level work (theme class, `dir`,
// fonts) on a cold load at `/` rather than only once a preview is selected.
function IndexComponent() {
  return <Preview preview={null} Provider={Provider} />
}
