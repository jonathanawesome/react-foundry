import { ThemeProvider } from '@react-foundry/style'
import { Layout, Navigation, Shelf } from '@react-foundry/ui'
import { createRootRoute, Outlet } from '@tanstack/react-router'

import { discoverComponents } from '../utils/discovery'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const components = discoverComponents()

  return (
    <ThemeProvider>
      <Layout>
        <Shelf components={components} />
        <Outlet />
        <Navigation />
      </Layout>
    </ThemeProvider>
  )
}
