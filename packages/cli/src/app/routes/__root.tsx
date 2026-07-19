/// <reference types="vite/client" />

import { foundryTitle } from 'virtual:react-foundry-config'
import { findLeaf } from '@react-foundry/core'
import { ThemeProvider } from '@react-foundry/style'
import { Layout, Navigation, PropsPanel, Shelf } from '@react-foundry/ui'
import { createRootRoute, Outlet, useParams } from '@tanstack/react-router'
import { useEffect } from 'react'

import { discoverNav } from '../nav'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const nav = discoverNav()

  // The active leaf, resolved the same way the canvas resolves it. The `$`
  // loader is synchronous, so this and the loader data commit together — no
  // split-brain between the panel's controls and the rendered preview.
  const params = useParams({ strict: false })
  const splat = '_splat' in params ? ((params._splat as string) ?? '') : ''
  const activeLeaf = findLeaf(nav, splat)

  useEffect(() => {
    document.title = foundryTitle || 'React Foundry'
  })

  return (
    <ThemeProvider>
      <Layout>
        <Shelf nav={nav} />
        <Outlet />
        <PropsPanel controls={activeLeaf?.component.controls} />
        <Navigation />
      </Layout>
    </ThemeProvider>
  )
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
