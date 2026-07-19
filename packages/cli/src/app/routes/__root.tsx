/// <reference types="vite/client" />

import { foundryTitle } from 'virtual:react-foundry-config'
import { ThemeProvider } from '@react-foundry/style'
import { Layout, Navigation, Shelf } from '@react-foundry/ui'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect } from 'react'

import { discoverNav } from '../utils/discovery'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const nav = discoverNav()

  useEffect(() => {
    document.title = foundryTitle || 'React Foundry'
  })

  return (
    <ThemeProvider>
      <Layout>
        <Shelf nav={nav} />
        <Outlet />
        <Navigation />
      </Layout>
    </ThemeProvider>
  )
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
