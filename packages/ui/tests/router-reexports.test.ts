import {
  createRootRoute as routerCreateRootRoute,
  createRoute as routerCreateRoute,
  createRouter as routerCreateRouter,
  Outlet as routerOutlet,
  RouterProvider as routerRouterProvider,
  useMatch as routerUseMatch,
} from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useMatch,
} from '../src/index'

/**
 * The app tree imports these six from here rather than from `@tanstack/react-router`,
 * because it is compiled by the consumer's Vite and a bare router specifier there would
 * land in their module graph. Nothing in this package fails if one is dropped: the
 * breakage surfaces in react-foundry's app tree, a long way from the edit.
 */
const APP_TREE_ROUTER_SURFACE = [
  ['createRootRoute', createRootRoute, routerCreateRootRoute],
  ['createRoute', createRoute, routerCreateRoute],
  ['createRouter', createRouter, routerCreateRouter],
  ['Outlet', Outlet, routerOutlet],
  ['RouterProvider', RouterProvider, routerRouterProvider],
  ['useMatch', useMatch, routerUseMatch],
] as const

describe('the router surface re-exported for the app tree', () => {
  for (const [name, reexported, original] of APP_TREE_ROUTER_SURFACE) {
    it(`re-exports ${name}, bound to the router itself`, () => {
      expect(reexported).toBe(original)
    })
  }
})
