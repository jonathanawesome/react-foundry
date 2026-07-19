import type { NavNode, Preview, PreviewLeaf } from '@react-foundry/core'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { ancestorPaths, Shelf } from '../src/components/shelf'
import { useUIStore } from '../src/state'
import { renderWithRouter } from './test-utils'

const previewFn = (() => null) as unknown as Preview

function leaf(id: string, label = id.split('/').pop() ?? id): PreviewLeaf {
  return { id, label, exportName: label, component: previewFn }
}

function node(
  path: string,
  { leaves = [], children = [] }: { leaves?: PreviewLeaf[]; children?: NavNode[] } = {}
): NavNode {
  return { label: path.split('/').pop() ?? path, path, children, leaves }
}

describe('ancestorPaths', () => {
  it('lists every ancestor of a leaf, not just its parent', () => {
    expect(ancestorPaths('a/b/c/Primary')).toEqual(['a', 'a/b', 'a/b/c'])
  })

  it('handles a leaf directly under a root node', () => {
    expect(ancestorPaths('Forms/Primary')).toEqual(['Forms'])
  })
})

describe('Shelf', () => {
  beforeEach(() => {
    useUIStore.setState({
      isAccessibilityEnabled: false,
      isShelfOpen: true,
      isShelfPinned: true,
      // Expansion is persisted now, so it survives between tests unless reset.
      expandedNodes: [],
    })
  })

  it('renders the shell but no entries when the tree is empty', async () => {
    const { container } = await renderWithRouter(<Shelf nav={[]} />)

    // Assert the shell survives, or this passes when Shelf renders nothing.
    expect(container.querySelector('aside')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('renders a top level node', async () => {
    await renderWithRouter(<Shelf nav={[node('Forms')]} />)

    expect(screen.getByRole('button', { name: /Forms/ })).toBeInTheDocument()
  })

  it('keeps nodes collapsed until clicked', async () => {
    await renderWithRouter(
      <Shelf nav={[node('Forms', { leaves: [leaf('Forms/Primary')] })]} />
    )

    expect(screen.queryByRole('link', { name: 'Primary' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /Forms/ }))

    expect(screen.getByRole('link', { name: 'Primary' })).toBeInTheDocument()
  })

  it('collapses again on a second click', async () => {
    await renderWithRouter(
      <Shelf nav={[node('Forms', { leaves: [leaf('Forms/Primary')] })]} />
    )

    const toggle = screen.getByRole('button', { name: /Forms/ })
    await userEvent.click(toggle)
    await userEvent.click(toggle)

    expect(screen.queryByRole('link', { name: 'Primary' })).not.toBeInTheDocument()
  })

  // The recursion is the point: the old flat structure could only ever express
  // category, component, and a variants/demos section.
  it('renders a tree more than three levels deep', async () => {
    const tree = [
      node('a', {
        children: [
          node('a/b', {
            children: [node('a/b/c', { leaves: [leaf('a/b/c/Primary')] })],
          }),
        ],
      }),
    ]

    await renderWithRouter(<Shelf nav={tree} />, '/a/b/c/Primary')

    expect(screen.getByRole('link', { name: 'Primary' })).toBeInTheDocument()
  })

  it('links a leaf to its nav path', async () => {
    await renderWithRouter(
      <Shelf nav={[node('Forms', { leaves: [leaf('Forms/Primary')] })]} />,
      '/Forms/Primary'
    )

    expect(screen.getByRole('link', { name: 'Primary' })).toHaveAttribute(
      'href',
      '/Forms/Primary'
    )
  })

  it('uses the leaf label for display while keeping the export name in the url', async () => {
    const custom: PreviewLeaf = {
      id: 'Forms/AllSizes',
      label: 'Every Size',
      exportName: 'AllSizes',
      component: previewFn,
    }

    await renderWithRouter(
      <Shelf nav={[node('Forms', { leaves: [custom] })]} />,
      '/Forms/AllSizes'
    )

    expect(screen.getByRole('link', { name: 'Every Size' })).toHaveAttribute(
      'href',
      '/Forms/AllSizes'
    )
  })

  // A deeply nested active leaf must not stay hidden behind collapsed ancestors.
  it('auto-expands every ancestor of the active leaf', async () => {
    const tree = [
      node('a', {
        children: [
          node('a/b', {
            children: [node('a/b/c', { leaves: [leaf('a/b/c/Primary')] })],
          }),
        ],
      }),
    ]

    await renderWithRouter(<Shelf nav={tree} />, '/a/b/c/Primary')

    for (const label of ['a', 'b', 'c']) {
      expect(
        screen.getByRole('button', { name: new RegExp(`^${label}$`) })
      ).toHaveAttribute('data-expanded', 'true')
    }
  })

  it('marks the active leaf and leaves its siblings inactive', async () => {
    const tree = [
      node('Forms', { leaves: [leaf('Forms/Primary'), leaf('Forms/Danger')] }),
    ]

    await renderWithRouter(<Shelf nav={tree} />, '/Forms/Primary')

    expect(screen.getByRole('link', { name: 'Primary' })).toHaveAttribute(
      'data-active',
      'true'
    )
    expect(screen.getByRole('link', { name: 'Danger' })).toHaveAttribute(
      'data-active',
      'false'
    )
  })

  it('does not expand a node the route does not touch', async () => {
    const tree = [
      node('Forms', { leaves: [leaf('Forms/Primary')] }),
      node('Layout', { leaves: [leaf('Layout/Stack')] }),
    ]

    await renderWithRouter(<Shelf nav={tree} />, '/Forms/Primary')

    expect(screen.getByRole('button', { name: /Layout/ })).toHaveAttribute(
      'data-expanded',
      'false'
    )
  })

  it('renders a node that has children but no leaves', async () => {
    const tree = [node('Forms', { children: [node('Forms/Button')] })]

    await renderWithRouter(<Shelf nav={tree} />)
    await userEvent.click(screen.getByRole('button', { name: /Forms/ }))

    expect(screen.getByRole('button', { name: /Button/ })).toBeInTheDocument()
  })

  it('renders a node that has both leaves and children', async () => {
    const tree = [
      node('Forms', {
        leaves: [leaf('Forms/Overview')],
        children: [node('Forms/Button')],
      }),
    ]

    await renderWithRouter(<Shelf nav={tree} />)
    await userEvent.click(screen.getByRole('button', { name: /^Forms$/ }))

    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Button/ })).toBeInTheDocument()
  })

  it('reflects open and pinned store state on the shelf element', async () => {
    useUIStore.setState({ isShelfOpen: false, isShelfPinned: false })

    const { container } = await renderWithRouter(<Shelf nav={[node('Forms')]} />)
    const shelf = container.querySelector('aside')

    expect(shelf).toHaveAttribute('data-open', 'false')
    expect(shelf).toHaveAttribute('data-pinned', 'false')
  })
})
