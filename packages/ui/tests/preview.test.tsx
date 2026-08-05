import { createPreview, type FoundryProvider } from '@react-foundry/core'
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

  // The consumer's global provider wraps the preview inside the canvas, and receives
  // foundry's resolved mode. Outside a ThemeProvider that mode defaults to light.
  it('wraps the preview in the given Provider and passes the resolved theme', async () => {
    const Provider: FoundryProvider = ({ children, theme }) => (
      <div data-testid="consumer-provider" data-theme={theme}>
        {children}
      </div>
    )

    await renderWithRouter(
      <Preview preview={createPreview(() => <p>Inside</p>)} Provider={Provider} />
    )

    const wrapper = screen.getByTestId('consumer-provider')
    expect(wrapper).toHaveAttribute('data-theme', 'light')
    expect(wrapper).toContainElement(screen.getByText('Inside'))
  })

  /**
   * The Provider used to mount only on a rendered preview, so a design system that does
   * document-level work on mount (a theme class on `<html>`, `dir`, fonts, portal roots)
   * did none of it until one was selected, and undid it again on any group node. The
   * consumer-side workaround for that was a MutationObserver at module scope.
   */
  describe('the consumer Provider on a surface with no preview', () => {
    const Provider: FoundryProvider = ({ children, theme }) => (
      <div data-testid="consumer-provider" data-theme={theme}>
        {children}
      </div>
    )

    it('mounts on the empty state', async () => {
      await renderWithRouter(<Preview preview={null} Provider={Provider} />)

      expect(screen.getByTestId('consumer-provider')).toBeInTheDocument()
    })

    it('mounts alongside a fallback', async () => {
      await renderWithRouter(
        <Preview preview={null} Provider={Provider} fallback={<p>Group landing</p>} />
      )

      expect(screen.getByTestId('consumer-provider')).toBeInTheDocument()
      expect(screen.getByText('Group landing')).toBeInTheDocument()
    })

    // The fallback is foundry's own chrome. Inside consumer context it would inherit the
    // consumer's wrapper, which inverts the isolation the canvas boundary exists to keep.
    it('leaves the fallback outside the Provider', async () => {
      await renderWithRouter(
        <Preview preview={null} Provider={Provider} fallback={<p>Group landing</p>} />
      )

      expect(screen.getByTestId('consumer-provider')).not.toContainElement(
        screen.getByText('Group landing')
      )
    })

    // Canvas-scoped consumer CSS should apply in every state, not only once something
    // is selected.
    it('keeps the canvas boundary marked', async () => {
      const { container } = await renderWithRouter(
        <Preview preview={null} Provider={Provider} />
      )

      const canvas = container.querySelector('[data-foundry-canvas]')
      expect(canvas).not.toBeNull()
      expect(canvas).toHaveAttribute('data-empty', 'true')
    })

    it('marks the canvas as occupied once a preview renders', async () => {
      const { container } = await renderWithRouter(
        <Preview preview={createPreview(() => <p>Hello</p>)} Provider={Provider} />
      )

      expect(container.querySelector('[data-foundry-canvas]')).toHaveAttribute(
        'data-empty',
        'false'
      )
    })

    it('prefers the fallback over the empty message', async () => {
      await renderWithRouter(
        <Preview preview={null} fallback={<p>Group landing</p>} emptyMessage="Nothing" />
      )

      expect(screen.getByText('Group landing')).toBeInTheDocument()
      expect(screen.queryByText('Nothing')).not.toBeInTheDocument()
    })
  })
})
