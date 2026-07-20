import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { Layout } from '../src/components/layout'
import { useUIStore } from '../src/state'

describe('Layout', () => {
  beforeEach(() => {
    useUIStore.setState({
      isShelfOpen: true,
      isPanelOpen: true,
    })
  })

  it('marks the shelf open so the stylesheet can reserve room for it', () => {
    const { container } = render(<Layout>content</Layout>)

    expect(container.firstElementChild).toHaveAttribute('data-shelf-open', 'true')
  })

  it('drops the shelf marker when the shelf is closed', () => {
    useUIStore.setState({ isShelfOpen: false })

    const { container } = render(<Layout>content</Layout>)

    expect(container.firstElementChild).toHaveAttribute('data-shelf-open', 'false')
  })

  it('marks the panel open so the stylesheet can reserve room for it', () => {
    const { container } = render(<Layout>content</Layout>)

    expect(container.firstElementChild).toHaveAttribute('data-panel-open', 'true')
  })

  it('drops the panel marker when the panel is closed', () => {
    useUIStore.setState({ isPanelOpen: false })

    const { container } = render(<Layout>content</Layout>)

    expect(container.firstElementChild).toHaveAttribute('data-panel-open', 'false')
  })
})
