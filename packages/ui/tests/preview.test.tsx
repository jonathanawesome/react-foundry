import { createPreview, type FoundryProvider } from '@react-foundry/core'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'

import { Preview } from '../src/components/preview'
import { PropsPanel } from '../src/components/props-panel'
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

  /**
   * The controlled counterpart of the hooks test above: `render` holds its own
   * state, with no wrapper component extracted to carry it, and a controls change
   * re-renders it with new props rather than remounting it. This depends on
   * `createPreview` mounting `render` as an element with a stable identity: a
   * fresh function per render would be a new component type to React, and the
   * count would reset to 0 on every control edit.
   */
  it('keeps state held directly in render across a controls change', async () => {
    const preview = createPreview({
      controls: { variant: { type: 'select', options: ['primary', 'danger'] } },
      render: (v) => {
        const [count, setCount] = useState(0)
        return (
          <button type="button" onClick={() => setCount(count + 1)}>
            {v.variant} clicked {count}
          </button>
        )
      },
    })
    useUIStore.setState({ isPanelOpen: true })

    await renderWithRouter(
      <>
        <Preview preview={preview} />
        <PropsPanel controls={preview.controls} />
      </>,
      '/Forms/Button'
    )

    await userEvent.click(screen.getByRole('button', { name: 'primary clicked 0' }))
    await userEvent.click(screen.getByRole('button', { name: 'primary clicked 1' }))
    await userEvent.selectOptions(screen.getByRole('combobox'), 'danger')

    expect(screen.getByRole('button', { name: 'danger clicked 2' })).toBeInTheDocument()
  })

  // `derive` maps a control's value to what the prop takes. It runs here, between
  // coercing the URL and mounting render, so the panel and the URL only ever hold
  // the raw value.
  describe('a derived control', () => {
    const CLIENTS = ['acme', 'globex', 'initech']

    function derivedPreview(onDerive?: () => void) {
      return createPreview({
        controls: {
          count: {
            type: 'select',
            options: ['1', '2', '3'],
            default: '1',
            derive: (n) => {
              onDerive?.()
              return CLIENTS.slice(0, Number(n))
            },
          },
        },
        render: (v) => <p>{v.count.join(', ')}</p>,
      })
    }

    it('hands render the derived value', async () => {
      await renderWithRouter(<Preview preview={derivedPreview()} />, '/Forms/Select')

      expect(screen.getByText('acme')).toBeInTheDocument()
    })

    it('derives from a value read off the URL', async () => {
      await renderWithRouter(
        <Preview preview={derivedPreview()} />,
        '/Forms/Select?count=3'
      )

      expect(screen.getByText('acme, globex, initech')).toBeInTheDocument()
    })

    it('re-derives when the control changes', async () => {
      const preview = derivedPreview()
      useUIStore.setState({ isPanelOpen: true })

      await renderWithRouter(
        <>
          <Preview preview={preview} />
          <PropsPanel controls={preview.controls} />
        </>,
        '/Forms/Select'
      )
      await userEvent.selectOptions(screen.getByRole('combobox'), '2')

      expect(screen.getByText('acme, globex')).toBeInTheDocument()
    })

    // The canvas re-renders for reasons that have nothing to do with the values, a
    // pinned node or a theme flip among them. A derive is a user function of unknown
    // cost, so it runs once per values change and not once per render.
    it('derives once per values change, not on every render', async () => {
      let derived = 0
      const preview = derivedPreview(() => {
        derived += 1
      })
      useUIStore.setState({ isPanelOpen: true })

      // Re-renders Preview with a fresh element each time, so React cannot bail out
      // on element identity and the memo inside is what has to hold.
      function Harness() {
        const [tick, setTick] = useState(0)
        return (
          <>
            <Preview preview={preview} emptyMessage={`tick ${tick}`} />
            <PropsPanel controls={preview.controls} />
            <button type="button" onClick={() => setTick(tick + 1)}>
              rerender
            </button>
          </>
        )
      }

      await renderWithRouter(<Harness />, '/Forms/Select')
      expect(derived).toBe(1)

      await userEvent.click(screen.getByRole('button', { name: 'rerender' }))
      expect(derived).toBe(1)

      await userEvent.selectOptions(screen.getByRole('combobox'), '3')
      expect(screen.getByText('acme, globex, initech')).toBeInTheDocument()
      expect(derived).toBe(2)
    })
  })

  // A list's value reaches render as the array its rows make, from the default
  // and from the URL alike.
  describe('a list control', () => {
    const preview = createPreview({
      controls: {
        tags: { type: 'list', of: { type: 'text' }, default: ['one', 'two'] },
      },
      render: (v) => <p>{v.tags.join(', ')}</p>,
    })

    it('hands render the default rows', async () => {
      await renderWithRouter(<Preview preview={preview} />, '/Forms/Tags')

      expect(screen.getByText('one, two')).toBeInTheDocument()
    })

    it('hands render the rows read off the URL', async () => {
      const rows = encodeURIComponent(JSON.stringify(['a', 'b', 'c']))
      await renderWithRouter(<Preview preview={preview} />, `/Forms/Tags?tags=${rows}`)

      expect(screen.getByText('a, b, c')).toBeInTheDocument()
    })
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
