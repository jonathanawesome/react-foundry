import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { Layout } from '../src/components/layout'
import { useUIStore } from '../src/state'

describe('Layout', () => {
  beforeEach(() => {
    useUIStore.setState({
      isShelfOpen: true,
      isShelfPinned: true,
      isPanelOpen: true,
      isPanelPinned: true,
    })
  })

  it('marks itself pinned so the stylesheet can reserve room for the shelf', () => {
    const { container } = render(<Layout>content</Layout>)

    expect(container.firstElementChild).toHaveAttribute('data-shelf-pinned', 'true')
  })

  it('drops the shelf marker when the shelf is unpinned', () => {
    useUIStore.setState({ isShelfPinned: false })

    const { container } = render(<Layout>content</Layout>)

    expect(container.firstElementChild).toHaveAttribute('data-shelf-pinned', 'false')
  })

  it('marks itself panel-pinned so the stylesheet can reserve room for the panel', () => {
    const { container } = render(<Layout>content</Layout>)

    expect(container.firstElementChild).toHaveAttribute('data-panel-pinned', 'true')
  })

  it('drops the panel marker when the panel is unpinned', () => {
    useUIStore.setState({ isPanelPinned: false })

    const { container } = render(<Layout>content</Layout>)

    expect(container.firstElementChild).toHaveAttribute('data-panel-pinned', 'false')
  })
})
