import type { ControlSchema } from '@react-foundry/core'
import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { PropsPanel } from '../src/components/props-panel'
import { useUIStore } from '../src/state'

describe('PropsPanel', () => {
  beforeEach(() => {
    useUIStore.setState({ isPanelOpen: true, isPanelPinned: true })
  })

  it('reflects open and pinned store state on the aside', () => {
    useUIStore.setState({ isPanelOpen: false, isPanelPinned: false })

    const { container } = render(<PropsPanel />)
    const panel = container.querySelector('aside')

    expect(panel).toHaveAttribute('data-open', 'false')
    expect(panel).toHaveAttribute('data-pinned', 'false')
  })

  it('shows an empty state when the preview has no controls', () => {
    render(<PropsPanel />)

    expect(screen.getByText('This preview has no controls.')).toBeInTheDocument()
  })

  it('lists the control names when given a schema', () => {
    const controls: ControlSchema = {
      variant: { type: 'select', options: ['a', 'b'] },
      disabled: { type: 'boolean' },
    }

    render(<PropsPanel controls={controls} />)

    expect(screen.getByText('variant')).toBeInTheDocument()
    expect(screen.getByText('disabled')).toBeInTheDocument()
    expect(screen.queryByText('This preview has no controls.')).not.toBeInTheDocument()
  })
})
