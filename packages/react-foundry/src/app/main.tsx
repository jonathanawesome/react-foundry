import { createRouter, RouterProvider } from '@react-foundry/ui'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import '@react-foundry/style/global.css'
// The consumer's theme overrides, emitted as plain CSS by the CLI. Loaded after the
// base theme; its `html.` selectors outrank the defaults on specificity.
import 'virtual:react-foundry-theme'

import { routeTree } from './route-tree'

// Match the router basepath to Vite's `base` so deep links carry the deploy
// sub-path (e.g. a GitHub Pages project site at /repo-name/). Without it,
// generated hrefs sit at the server root and a refresh or copied URL 404s.
// Vite injects BASE_URL as the resolved `base`, defaulting to '/'.
const router = createRouter({ routeTree, basepath: import.meta.env.BASE_URL })

// Type-only module augmentation: it erases at transform, so this specifier is never
// resolved by the consumer's bundler even though this file is their Vite input. It is the
// one mention of `@tanstack/react-router` the app tree is allowed to keep. Augmenting a
// module TypeScript cannot resolve is an error, so the router stays a devDependency of
// this package to satisfy `tsc --noEmit`. Consumers never install it.
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
)
