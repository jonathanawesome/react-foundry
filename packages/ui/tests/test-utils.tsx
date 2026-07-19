import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from '@tanstack/react-router'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

/**
 * Renders `ui` inside a real in-memory router. A genuine router (rather than a stub) is
 * needed because `Link` resolves the `/$` splat route into hrefs, and
 * `useParams({ strict: false })` reads the matched nav path back off it.
 *
 * Note: the router is deliberately left unregistered. A `Register` declaration would
 * narrow `Link`'s `to` prop repo-wide and break `SectionItem`'s `to: string` in shelf.tsx.
 */
export async function renderWithRouter(ui: ReactNode, initialPath = '/') {
  const rootRoute = createRootRoute({
    component: () => (
      <>
        {ui}
        <Outlet />
      </>
    ),
  })

  const routes = [
    createRoute({ getParentRoute: () => rootRoute, path: '/', component: () => null }),
    // One splat route mirrors the real app: a nav path is arbitrarily deep, so
    // it cannot be expressed as fixed params.
    createRoute({ getParentRoute: () => rootRoute, path: '/$', component: () => null }),
  ]

  const router = createRouter({
    routeTree: rootRoute.addChildren(routes),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  })

  // Load before rendering so the first paint already has route params. Loading after
  // render would settle them in a state update outside act(), and assertions would run
  // against the pre-route DOM.
  await router.load()

  // biome-ignore lint/suspicious/noExplicitAny: the router is intentionally unregistered
  return render(<RouterProvider router={router as any} />)
}
