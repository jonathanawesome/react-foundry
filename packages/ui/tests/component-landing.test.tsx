import type { NavNode, Preview, PreviewLeaf } from '@react-foundry/core'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ComponentLanding } from '../src/components/component-landing'
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

describe('ComponentLanding', () => {
  it('names the missing path when there is no node', async () => {
    await renderWithRouter(<ComponentLanding node={null} path="Forms/Nope" />)

    expect(screen.getByRole('heading', { name: 'Not found' })).toBeInTheDocument()
    expect(screen.getByText(/Forms\/Nope/)).toBeInTheDocument()
  })

  it('offers a way home when there is no node', async () => {
    await renderWithRouter(<ComponentLanding node={null} path="Forms/Nope" />)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/')
  })

  it('shows the node label and path', async () => {
    await renderWithRouter(<ComponentLanding node={node('Forms/Button')} path="x" />)

    expect(screen.getByRole('heading', { name: 'Button' })).toBeInTheDocument()
    expect(screen.getByText('Forms/Button')).toBeInTheDocument()
  })

  it('says so when a node has nothing under it', async () => {
    await renderWithRouter(<ComponentLanding node={node('Forms')} path="Forms" />)

    expect(screen.getByText('Nothing here yet.')).toBeInTheDocument()
  })

  it('lists previews when the node has leaves', async () => {
    const target = node('Forms', { leaves: [leaf('Forms/Primary')] })

    await renderWithRouter(<ComponentLanding node={target} path="Forms" />)

    expect(screen.getByRole('heading', { name: 'Previews' })).toBeInTheDocument()
    expect(screen.queryByText('Nothing here yet.')).not.toBeInTheDocument()
  })

  it('lists sections when the node has children', async () => {
    const target = node('Forms', { children: [node('Forms/Button')] })

    await renderWithRouter(<ComponentLanding node={target} path="Forms" />)

    expect(screen.getByRole('heading', { name: 'Sections' })).toBeInTheDocument()
  })

  it('lists both when the node has leaves and children', async () => {
    const target = node('Forms', {
      leaves: [leaf('Forms/Overview')],
      children: [node('Forms/Button')],
    })

    await renderWithRouter(<ComponentLanding node={target} path="Forms" />)

    expect(screen.getByRole('link', { name: 'Overview' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Button' })).toBeInTheDocument()
  })

  // Leaves link by id, children by path. Swapping them produces plausible URLs
  // that resolve to nothing.
  it('links a leaf by its id and a child by its path', async () => {
    const target = node('Forms', {
      leaves: [leaf('Forms/Overview')],
      children: [node('Forms/Button')],
    })

    await renderWithRouter(<ComponentLanding node={target} path="Forms" />)

    expect(screen.getByRole('link', { name: 'Overview' })).toHaveAttribute(
      'href',
      '/Forms/Overview'
    )
    expect(screen.getByRole('link', { name: 'Button' })).toHaveAttribute(
      'href',
      '/Forms/Button'
    )
  })

  it('uses the leaf label rather than its export name', async () => {
    const custom: PreviewLeaf = {
      id: 'Forms/AllSizes',
      label: 'Every Size',
      exportName: 'AllSizes',
      component: previewFn,
    }

    await renderWithRouter(
      <ComponentLanding node={node('Forms', { leaves: [custom] })} path="Forms" />
    )

    expect(screen.getByRole('link', { name: 'Every Size' })).toHaveAttribute(
      'href',
      '/Forms/AllSizes'
    )
  })
})
