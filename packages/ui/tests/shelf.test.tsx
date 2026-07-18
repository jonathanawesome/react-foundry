import type { DiscoveredComponent } from '@react-foundry/core'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { Shelf } from '../src/components/shelf'
import { useUIStore } from '../src/state'
import { renderWithRouter } from './test-utils'

/** Helper to build a discovered component without repeating the required fields */
function component(overrides: Partial<DiscoveredComponent> = {}): DiscoveredComponent {
  return {
    id: 'button',
    path: '/proj/src/components/button.preview.tsx',
    title: 'Button',
    name: 'Button',
    category: 'Components',
    component: () => null,
    variants: [{ name: 'Primary', props: {} }],
    demos: [{ name: 'Interactive', render: () => <div /> }],
    ...overrides,
  }
}

describe('Shelf', () => {
  beforeEach(() => {
    useUIStore.setState({
      isAccessibilityEnabled: false,
      isShelfOpen: true,
      isShelfPinned: true,
    })
  })

  it('renders a heading per category with its components grouped underneath', async () => {
    await renderWithRouter(
      <Shelf
        components={[
          component({ id: 'button', name: 'Button', category: 'Components' }),
          component({ id: 'field', name: 'Field', category: 'Forms' }),
        ]}
      />
    )

    const components = screen.getByRole('heading', { name: 'Components' })
    const forms = screen.getByRole('heading', { name: 'Forms' })

    expect(
      components.parentElement?.querySelector('button[data-expanded]')
    ).toHaveTextContent('Button')
    expect(forms.parentElement?.querySelector('button[data-expanded]')).toHaveTextContent(
      'Field'
    )
  })

  it('renders nothing but the shell when there are no components', async () => {
    await renderWithRouter(<Shelf components={[]} />)

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps components collapsed until clicked', async () => {
    await renderWithRouter(<Shelf components={[component()]} />)

    expect(screen.queryByRole('button', { name: /Variants/ })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Button' }))

    expect(screen.getByRole('button', { name: /Variants/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Demos/ })).toBeInTheDocument()
  })

  it('auto-expands the component matching the route', async () => {
    await renderWithRouter(<Shelf components={[component()]} />, '/button')

    expect(screen.getByRole('button', { name: 'Button' })).toHaveAttribute(
      'data-expanded',
      'true'
    )
    expect(screen.getByRole('button', { name: /Variants/ })).toBeInTheDocument()
  })

  it('does not auto-expand a component the route does not match', async () => {
    await renderWithRouter(
      <Shelf components={[component(), component({ id: 'card', name: 'Card' })]} />,
      '/button'
    )

    expect(screen.getByRole('button', { name: 'Card' })).toHaveAttribute(
      'data-expanded',
      'false'
    )
  })

  it('auto-expands the variants section and marks the active variant on a variant route', async () => {
    await renderWithRouter(
      <Shelf components={[component()]} />,
      '/button/variant/Primary'
    )

    expect(screen.getByRole('button', { name: /Variants/ })).toHaveAttribute(
      'data-active',
      'true'
    )
    expect(screen.getByRole('link', { name: 'Primary' })).toHaveAttribute(
      'data-active',
      'true'
    )
  })

  it('auto-expands the demos section and marks the active demo on a demo route', async () => {
    await renderWithRouter(
      <Shelf components={[component()]} />,
      '/button/demo/Interactive'
    )

    expect(screen.getByRole('button', { name: /Demos/ })).toHaveAttribute(
      'data-active',
      'true'
    )
    expect(screen.getByRole('link', { name: 'Interactive' })).toHaveAttribute(
      'data-active',
      'true'
    )
  })

  it('omits the variants section for a component with no variants', async () => {
    await renderWithRouter(
      <Shelf components={[component({ variants: [] })]} />,
      '/button'
    )

    expect(screen.queryByRole('button', { name: /Variants/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Demos/ })).toBeInTheDocument()
  })

  it('reflects open and pinned store state on the shelf element', async () => {
    useUIStore.setState({ isShelfOpen: false, isShelfPinned: false })

    const { container } = await renderWithRouter(<Shelf components={[component()]} />)
    const shelf = container.querySelector('aside')

    expect(shelf).toHaveAttribute('data-open', 'false')
    expect(shelf).toHaveAttribute('data-pinned', 'false')
  })
})
