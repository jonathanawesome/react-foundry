/// <reference types="vite/client" />

import { foundryTitle } from 'virtual:react-foundry-config'
import { ThemeProvider } from '@react-foundry/style'
import { Layout, Navigation, Shelf } from '@react-foundry/ui'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

import { discoverComponents } from '../utils/discovery'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const components = discoverComponents()

  useEffect(() => {
    document.title = foundryTitle || 'React Foundry'
  })

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

if (import.meta.hot) {
  import.meta.hot.accept()
}
