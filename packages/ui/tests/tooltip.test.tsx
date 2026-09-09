import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { Tooltip } from '../src/components/tooltip'

describe('Tooltip', () => {
  it('stays closed until the control is hovered or focused', () => {
    render(
      <Tooltip label="Toggle Theme" shortcut="t">
        <button type="button">theme</button>
      </Tooltip>
    )

    expect(screen.queryByText('Toggle Theme')).not.toBeInTheDocument()
  })

  it('opens on hover and closes again on leave', async () => {
    render(
      <Tooltip label="Toggle Theme" shortcut="t">
        <button type="button">theme</button>
      </Tooltip>
    )
    const trigger = screen.getByRole('button', { name: 'theme' })

    await userEvent.hover(trigger)
    expect(screen.getByText('Toggle Theme')).toBeInTheDocument()

    await userEvent.unhover(trigger)
    expect(screen.queryByText('Toggle Theme')).not.toBeInTheDocument()
  })

  // Keyboard users get the same hint mouse users do.
  it('opens when the control takes focus and closes when it loses it', async () => {
    render(
      <>
        <Tooltip label="Toggle Theme" shortcut="t">
          <button type="button">theme</button>
        </Tooltip>
        <button type="button">elsewhere</button>
      </>
    )

    await userEvent.tab()
    expect(screen.getByText('Toggle Theme')).toBeInTheDocument()

    await userEvent.tab()
    expect(screen.queryByText('Toggle Theme')).not.toBeInTheDocument()
  })

  it('renders the shortcut as a key cap', async () => {
    render(
      <Tooltip label="Toggle Theme" shortcut="t">
        <button type="button">theme</button>
      </Tooltip>
    )

    await userEvent.hover(screen.getByRole('button', { name: 'theme' }))
    expect(screen.getByText('t').tagName).toBe('KBD')
  })

  it('omits the key cap when there is no shortcut', async () => {
    render(
      <Tooltip label="Toggle Theme">
        <button type="button">theme</button>
      </Tooltip>
    )

    await userEvent.hover(screen.getByRole('button', { name: 'theme' }))
    expect(
      screen.getByText('Toggle Theme').parentElement?.querySelector('kbd')
    ).toBeNull()
  })

  // The wrapped control already carries the same words as its accessible name,
  // so announcing the bubble too would say everything twice.
  it('hides the bubble from assistive tech', async () => {
    render(
      <Tooltip label="Toggle Theme" shortcut="t">
        <button type="button" aria-label="Toggle Theme">
          theme
        </button>
      </Tooltip>
    )

    await userEvent.hover(screen.getByRole('button', { name: 'Toggle Theme' }))
    expect(screen.getByText('Toggle Theme').parentElement).toHaveAttribute(
      'aria-hidden',
      'true'
    )
  })
})
