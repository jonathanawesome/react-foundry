/// <reference types="vite/client" />

import { foundryTitle } from 'virtual:react-foundry-config'
import { ThemeProvider } from '@react-foundry/style'
import { Layout, PropsPanel, Shelf, Toolbar } from '@react-foundry/ui'
import { createRootRoute, Outlet, useMatch } from '@tanstack/react-router'
import { useEffect } from 'react'

import { discoverNav } from '../nav'

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const nav = discoverNav()

  // The active preview's controls come off the same `/$` loader data the canvas
  // renders from, so the panel and the preview always reflect one atomically
  // committed value — no split-brain between them during a pending navigation.
  // `shouldThrow: false` returns undefined on the index route, where nothing is
  // selected; selecting just the controls keeps a search-param edit from
  // re-rendering the whole shell.
  const controls = useMatch({
    from: '/$',
    shouldThrow: false,
    select: (match) => match.loaderData?.component?.controls,
  })

  useEffect(() => {
    document.title = foundryTitle || 'React Foundry'
  })

  return (
    <ThemeProvider>
      <Layout>
        <Shelf nav={nav} />
        <Outlet />
        <PropsPanel controls={controls} />
        <Toolbar />
      </Layout>
    </ThemeProvider>
  )
}

if (import.meta.hot) {
  import.meta.hot.accept()
}
