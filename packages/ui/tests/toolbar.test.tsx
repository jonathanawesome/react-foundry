import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Toolbar } from '../src/components/toolbar'
import { useUIStore } from '../src/state'

const setTheme = vi.fn()
let theme = 'system'
let resolvedTheme = 'light'

vi.mock('@react-foundry/style', async () => {
  const actual = await vi.importActual('@react-foundry/style')
  return { ...actual, useTheme: () => ({ theme, resolvedTheme, setTheme }) }
})

describe('Toolbar', () => {
  beforeEach(() => {
    setTheme.mockClear()
    theme = 'system'
    resolvedTheme = 'light'
    useUIStore.setState({
      isAccessibilityEnabled: false,
      isShelfOpen: true,
      isPanelOpen: true,
      expandedNodes: [],
    })
  })

  it('toggles the shelf open and closed', async () => {
    render(<Toolbar />)
    const toggle = screen.getByLabelText('Toggle Component List')

    await userEvent.click(toggle)
    expect(useUIStore.getState().isShelfOpen).toBe(false)

    await userEvent.click(toggle)
    expect(useUIStore.getState().isShelfOpen).toBe(true)
  })

  it('toggles the controls panel open and closed', async () => {
    render(<Toolbar />)
    const toggle = screen.getByLabelText('Toggle Controls Panel')

    await userEvent.click(toggle)
    expect(useUIStore.getState().isPanelOpen).toBe(false)

    await userEvent.click(toggle)
    expect(useUIStore.getState().isPanelOpen).toBe(true)
  })

  it('toggles accessibility', async () => {
    render(<Toolbar />)
    await userEvent.click(screen.getByLabelText('Enable Accessibility Check'))

    expect(useUIStore.getState().isAccessibilityEnabled).toBe(true)
  })

  describe('active state', () => {
    it('marks the shelf and panel toggles active when open', () => {
      useUIStore.setState({ isShelfOpen: true, isPanelOpen: true })
      render(<Toolbar />)

      expect(screen.getByLabelText('Toggle Component List')).toHaveAttribute(
        'data-active',
        'true'
      )
      expect(screen.getByLabelText('Toggle Controls Panel')).toHaveAttribute(
        'data-active',
        'true'
      )
    })

    it('marks the shelf and panel toggles inactive when closed', () => {
      useUIStore.setState({ isShelfOpen: false, isPanelOpen: false })
      render(<Toolbar />)

      expect(screen.getByLabelText('Toggle Component List')).toHaveAttribute(
        'data-active',
        'false'
      )
      expect(screen.getByLabelText('Toggle Controls Panel')).toHaveAttribute(
        'data-active',
        'false'
      )
    })

    it('marks the accessibility toggle active when enabled', () => {
      useUIStore.setState({ isAccessibilityEnabled: true })
      render(<Toolbar />)

      expect(screen.getByLabelText('Disable Accessibility Check')).toHaveAttribute(
        'data-active',
        'true'
      )
    })

    // The theme switcher has no on/off state, so it never carries one.
    it('leaves the theme switcher without an active state', () => {
      render(<Toolbar />)

      expect(screen.getByLabelText('Toggle Theme')).not.toHaveAttribute(
        'data-active',
        'true'
      )
    })
  })

  it('reflects accessibility being on in the button label', () => {
    useUIStore.setState({ isAccessibilityEnabled: true })
    render(<Toolbar />)

    expect(screen.getByLabelText('Disable Accessibility Check')).toBeInTheDocument()
  })

  describe('tooltips', () => {
    // The custom tooltip replaces the browser's; both would stack on hover.
    it('leaves the native tooltip off', () => {
      render(<Toolbar />)

      expect(screen.getByLabelText('Toggle Theme')).not.toHaveAttribute('title')
    })

    it('names the control and its shortcut on hover', async () => {
      render(<Toolbar />)
      await userEvent.hover(screen.getByLabelText('Toggle Theme'))

      expect(screen.getByText('Toggle Theme')).toBeInTheDocument()
      expect(screen.getByText('t').tagName).toBe('KBD')
    })

    it('describes every control', async () => {
      const expected = [
        ['Toggle Component List', 's'],
        ['Toggle Controls Panel', 'p'],
        ['Toggle Theme', 't'],
        ['Enable Accessibility Check', 'a'],
      ]

      for (const [label, key] of expected) {
        const { unmount } = render(<Toolbar />)
        await userEvent.hover(screen.getByLabelText(label))

        expect(screen.getByText(label)).toBeInTheDocument()
        expect(screen.getByText(key).tagName).toBe('KBD')
        unmount()
      }
    })
  })

  describe('keyboard shortcuts', () => {
    it('toggles the shelf on s', async () => {
      render(<Toolbar />)
      await userEvent.keyboard('s')

      expect(useUIStore.getState().isShelfOpen).toBe(false)
    })

    it('toggles the controls panel on p', async () => {
      render(<Toolbar />)
      await userEvent.keyboard('p')

      expect(useUIStore.getState().isPanelOpen).toBe(false)
    })

    it('toggles the theme on t', async () => {
      render(<Toolbar />)
      await userEvent.keyboard('t')

      expect(setTheme).toHaveBeenCalledWith('dark')
    })

    it('toggles accessibility on a', async () => {
      render(<Toolbar />)
      await userEvent.keyboard('a')

      expect(useUIStore.getState().isAccessibilityEnabled).toBe(true)
    })

    it('matches the shortcut whatever the shift key is doing', async () => {
      render(<Toolbar />)
      await userEvent.keyboard('S')

      expect(useUIStore.getState().isShelfOpen).toBe(false)
    })

    it('fires against the current state rather than the state at mount', async () => {
      render(<Toolbar />)

      await userEvent.keyboard('s')
      await userEvent.keyboard('s')

      expect(useUIStore.getState().isShelfOpen).toBe(true)
    })

    it('ignores an unbound key', async () => {
      render(<Toolbar />)
      await userEvent.keyboard('z')

      expect(useUIStore.getState().isShelfOpen).toBe(true)
      expect(setTheme).not.toHaveBeenCalled()
    })

    // The canvas renders the consumer's own component, form controls and all.
    it('leaves typing in a text field alone', async () => {
      render(
        <>
          <Toolbar />
          <input aria-label="a preview's own field" />
        </>
      )

      await userEvent.type(screen.getByLabelText("a preview's own field"), 'spat')

      expect(screen.getByLabelText("a preview's own field")).toHaveValue('spat')
      expect(useUIStore.getState().isShelfOpen).toBe(true)
      expect(useUIStore.getState().isPanelOpen).toBe(true)
      expect(useUIStore.getState().isAccessibilityEnabled).toBe(false)
      expect(setTheme).not.toHaveBeenCalled()
    })

    it('leaves typing in a textarea alone', async () => {
      render(
        <>
          <Toolbar />
          <textarea aria-label="a preview's own notes" />
        </>
      )

      await userEvent.type(screen.getByLabelText("a preview's own notes"), 'stap')

      expect(useUIStore.getState().isShelfOpen).toBe(true)
    })

    it('leaves typing in a contenteditable alone', async () => {
      render(
        <>
          <Toolbar />
          {/* biome-ignore lint/a11y/useSemanticElements: a rich text editor is the real case */}
          <div contentEditable role="textbox" tabIndex={0} aria-label="an editor" />
        </>
      )

      await userEvent.type(screen.getByLabelText('an editor'), 's')

      expect(useUIStore.getState().isShelfOpen).toBe(true)
    })

    // A held modifier means the user is reaching for a browser or OS command.
    it('ignores a shortcut letter held with a modifier', async () => {
      render(<Toolbar />)

      await userEvent.keyboard('{Control>}s{/Control}')
      await userEvent.keyboard('{Meta>}p{/Meta}')
      await userEvent.keyboard('{Alt>}t{/Alt}')

      expect(useUIStore.getState().isShelfOpen).toBe(true)
      expect(useUIStore.getState().isPanelOpen).toBe(true)
      expect(setTheme).not.toHaveBeenCalled()
    })

    it('stops listening once the toolbar unmounts', async () => {
      const { unmount } = render(<Toolbar />)
      unmount()

      await userEvent.keyboard('s')

      expect(useUIStore.getState().isShelfOpen).toBe(true)
    })
  })

  describe('theme toggle', () => {
    // On `system` the current theme is whatever the OS resolved to, so the
    // toggle has to flip that rather than the stored preference.
    it('flips away from the resolved theme when following the system', async () => {
      theme = 'system'
      resolvedTheme = 'dark'
      render(<Toolbar />)
      await userEvent.click(screen.getByLabelText('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('light')
    })

    it('flips to dark when following the system in light mode', async () => {
      theme = 'system'
      resolvedTheme = 'light'
      render(<Toolbar />)
      await userEvent.click(screen.getByLabelText('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('dark')
    })

    it('flips an explicit dark theme to light', async () => {
      theme = 'dark'
      render(<Toolbar />)
      await userEvent.click(screen.getByLabelText('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('light')
    })

    it('flips an explicit light theme to dark', async () => {
      theme = 'light'
      render(<Toolbar />)
      await userEvent.click(screen.getByLabelText('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('dark')
    })
  })
})
