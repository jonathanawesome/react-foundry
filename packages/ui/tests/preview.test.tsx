import { createPreview } from '@react-foundry/core'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { Preview } from '../src/components/preview'
import { useUIStore } from '../src/state'
import { renderWithRouter } from './test-utils'

describe('Preview', () => {
  beforeEach(() => {
    useUIStore.setState({
      isAccessibilityEnabled: false,
      isShelfOpen: true,
      isShelfPinned: true,
    })
  })

  it('renders the given preview', async () => {
    await renderWithRouter(<Preview preview={createPreview(() => <p>Hello</p>)} />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('renders the empty state when nothing is selected', async () => {
    await renderWithRouter(<Preview preview={null} />)

    expect(screen.getByText('Select a preview from the sidebar')).toBeInTheDocument()
  })

  it('accepts a custom empty message', async () => {
    await renderWithRouter(<Preview preview={null} emptyMessage="Nothing here" />)

    expect(screen.getByText('Nothing here')).toBeInTheDocument()
  })

  /**
   * The load-bearing test for the whole rework. Under the old model a preview
   * holding state had to be a `demo` rather than a `variant`; now there is one
   * primitive and hooks must work in it.
   *
   * This only passes because Preview renders the function as an element rather
   * than calling it, which is what gives it its own fiber.
   */
  it('supports hooks and interaction inside a preview', async () => {
    const Counter = createPreview(() => {
      const [count, setCount] = useState(0)
      return (
        <button type="button" onClick={() => setCount(count + 1)}>
          Clicked {count}
        </button>
      )
    })

    await renderWithRouter(<Preview preview={Counter} />)

    const button = screen.getByRole('button', { name: 'Clicked 0' })
    await userEvent.click(button)

    expect(screen.getByRole('button', { name: 'Clicked 1' })).toBeInTheDocument()
  })

  it('supports a preview built with the options form', async () => {
    const preview = createPreview({ label: 'Every Size', render: () => <p>Sizes</p> })

    await renderWithRouter(<Preview preview={preview} />)

    expect(screen.getByText('Sizes')).toBeInTheDocument()
  })

  it('feeds coerced URL search values into a controlled preview', async () => {
    const preview = createPreview({
      controls: { variant: { type: 'select', options: ['primary', 'danger'] } },
      render: (v) => <p>variant: {v?.variant}</p>,
    })

    await renderWithRouter(<Preview preview={preview} />, '/Forms/Button?variant=danger')

    expect(screen.getByText('variant: danger')).toBeInTheDocument()
  })
})
