import { isPreview } from '@react-foundry/core'
import { createMemoryHistory, createRouter } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'

import { routeTree } from '../src/app/route-tree'

/**
 * The route tree is hand-written rather than generated, so the invariants the codegen
 * used to hold are asserted here instead: the three routes exist under the right ids,
 * and one splat resolves a nav path of any depth onto the preview it names.
 *
 * Runs against a real router with in-memory history so the loaders actually execute,
 * which is where the nav path becomes the loader data the shell and canvas both read.
 */
async function loadAt(path: string) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
  })

  await router.load()

  // The deepest match is the route the URL landed on; everything above it is the shell.
  const { matches } = router.state

  return { router, match: matches[matches.length - 1] }
}

describe('the app route tree', () => {
  it('exposes exactly the shell, index and splat routes', async () => {
    const { router } = await loadAt('/')

    expect(Object.keys(router.routesById).sort()).toEqual(['/', '/$', '__root__'])
  })

  it('matches the index route at the root', async () => {
    const { match } = await loadAt('/')

    expect(match?.routeId).toBe('/')
  })

  it('routes an arbitrarily deep nav path through the splat route', async () => {
    const { match } = await loadAt('/Forms/Button/Basic')

    expect(match?.routeId).toBe('/$')
    expect((match?.params as { _splat?: string })._splat).toBe('Forms/Button/Basic')
  })

  it('loads the preview the nav path names', async () => {
    const { match } = await loadAt('/Forms/Button/Basic')
    const data = match?.loaderData as { component: unknown; path: string }

    expect(isPreview(data.component)).toBe(true)
    expect(data.path).toBe('Forms/Button/Basic')
  })

  it('resolves a group path to a landing rather than a preview', async () => {
    const { match } = await loadAt('/Forms')
    const data = match?.loaderData as {
      component: unknown
      node: { label: string } | undefined
    }

    expect(data.component).toBeNull()
    expect(data.node?.label).toBe('Forms')
  })

  it('passes search params through untouched, since controls have no fixed schema', async () => {
    const { match } = await loadAt('/Forms/Button/Basic?label=Hi&count=2')

    expect(match?.search).toEqual({ label: 'Hi', count: 2 })
  })
})
