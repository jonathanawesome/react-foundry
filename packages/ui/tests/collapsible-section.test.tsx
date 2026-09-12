import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { CollapsibleSection } from '../src/components/collapsible-section/collapsible-section'

describe('CollapsibleSection', () => {
  it('is a group named by its label, open by default', () => {
    render(
      <CollapsibleSection label="Variants">
        <p>inside</p>
      </CollapsibleSection>
    )

    expect(screen.getByRole('group', { name: 'Variants' })).toBeInTheDocument()
    expect(screen.getByText('inside')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Collapse variants' })).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  })

  it('folds its content away and back on the caret', async () => {
    render(
      <CollapsibleSection label="Variants">
        <p>inside</p>
      </CollapsibleSection>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Collapse variants' }))

    expect(screen.queryByText('inside')).not.toBeInTheDocument()
    const expand = screen.getByRole('button', { name: 'Expand variants' })
    expect(expand).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(expand)

    expect(screen.getByText('inside')).toBeInTheDocument()
  })

  // The actions sit on the border line, so a collapsed row can still be removed.
  it('keeps its actions reachable while collapsed', async () => {
    render(
      <CollapsibleSection
        label="Row 1"
        tight
        actions={<button type="button">Remove</button>}
      >
        <p>inside</p>
      </CollapsibleSection>
    )

    await userEvent.click(screen.getByRole('button', { name: 'Collapse row 1' }))

    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument()
  })
})
