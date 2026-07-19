import type { ControlSchema } from '@react-foundry/core'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { PropsPanel } from '../src/components/props-panel'
import { useUIStore } from '../src/state'
import { renderWithRouter } from './test-utils'

const controls: ControlSchema = {
  variant: { type: 'select', options: ['primary', 'danger'], default: 'primary' },
  disabled: { type: 'boolean', default: false },
}

describe('PropsPanel', () => {
  beforeEach(() => {
    useUIStore.setState({ isPanelOpen: true, isPanelPinned: true })
  })

  it('reflects open and pinned store state on the aside', async () => {
    useUIStore.setState({ isPanelOpen: false, isPanelPinned: false })

    const { container } = await renderWithRouter(<PropsPanel />)
    const panel = container.querySelector('aside')

    expect(panel).toHaveAttribute('data-open', 'false')
    expect(panel).toHaveAttribute('data-pinned', 'false')
  })

  it('shows an empty state when the preview has no controls', async () => {
    await renderWithRouter(<PropsPanel />)

    expect(screen.getByText('This preview has no controls.')).toBeInTheDocument()
  })

  it('renders an input per control', async () => {
    await renderWithRouter(<PropsPanel controls={controls} />, '/Forms/Button')

    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.queryByText('This preview has no controls.')).not.toBeInTheDocument()
  })

  it('reflects current values read from the URL search', async () => {
    await renderWithRouter(
      <PropsPanel controls={controls} />,
      '/Forms/Button?variant=danger&disabled=true'
    )

    expect(screen.getByRole('combobox')).toHaveValue('danger')
    expect(screen.getByRole('checkbox')).toBeChecked()
  })

  it('writes a changed discrete control to the URL, omitting defaults', async () => {
    const { router } = await renderWithRouter(
      <PropsPanel controls={controls} />,
      '/Forms/Button'
    )

    await userEvent.selectOptions(screen.getByRole('combobox'), 'danger')

    expect(router.state.location.search).toEqual({ variant: 'danger' })
  })

  it('drops a control from the URL when it returns to its default', async () => {
    const { router } = await renderWithRouter(
      <PropsPanel controls={controls} />,
      '/Forms/Button?variant=danger'
    )

    await userEvent.selectOptions(screen.getByRole('combobox'), 'primary')

    expect(router.state.location.search).toEqual({})
  })
})
