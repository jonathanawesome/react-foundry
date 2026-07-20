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
    const toggle = screen.getByTitle('Toggle Component List')

    await userEvent.click(toggle)
    expect(useUIStore.getState().isShelfOpen).toBe(false)

    await userEvent.click(toggle)
    expect(useUIStore.getState().isShelfOpen).toBe(true)
  })

  it('toggles the controls panel open and closed', async () => {
    render(<Toolbar />)
    const toggle = screen.getByTitle('Toggle Controls Panel')

    await userEvent.click(toggle)
    expect(useUIStore.getState().isPanelOpen).toBe(false)

    await userEvent.click(toggle)
    expect(useUIStore.getState().isPanelOpen).toBe(true)
  })

  it('toggles accessibility', async () => {
    render(<Toolbar />)
    await userEvent.click(screen.getByTitle('Enable Accessibility Check'))

    expect(useUIStore.getState().isAccessibilityEnabled).toBe(true)
  })

  describe('active state', () => {
    it('marks the shelf and panel toggles active when open', () => {
      useUIStore.setState({ isShelfOpen: true, isPanelOpen: true })
      render(<Toolbar />)

      expect(screen.getByTitle('Toggle Component List')).toHaveAttribute(
        'data-active',
        'true'
      )
      expect(screen.getByTitle('Toggle Controls Panel')).toHaveAttribute(
        'data-active',
        'true'
      )
    })

    it('marks the shelf and panel toggles inactive when closed', () => {
      useUIStore.setState({ isShelfOpen: false, isPanelOpen: false })
      render(<Toolbar />)

      expect(screen.getByTitle('Toggle Component List')).toHaveAttribute(
        'data-active',
        'false'
      )
      expect(screen.getByTitle('Toggle Controls Panel')).toHaveAttribute(
        'data-active',
        'false'
      )
    })

    it('marks the accessibility toggle active when enabled', () => {
      useUIStore.setState({ isAccessibilityEnabled: true })
      render(<Toolbar />)

      expect(screen.getByTitle('Disable Accessibility Check')).toHaveAttribute(
        'data-active',
        'true'
      )
    })

    // The theme switcher has no on/off state, so it never carries one.
    it('leaves the theme switcher without an active state', () => {
      render(<Toolbar />)

      expect(screen.getByTitle('Toggle Theme')).not.toHaveAttribute('data-active', 'true')
    })
  })

  it('reflects accessibility being on in the button title', () => {
    useUIStore.setState({ isAccessibilityEnabled: true })
    render(<Toolbar />)

    expect(screen.getByTitle('Disable Accessibility Check')).toBeInTheDocument()
  })

  describe('theme toggle', () => {
    // On `system` the current theme is whatever the OS resolved to, so the
    // toggle has to flip that rather than the stored preference.
    it('flips away from the resolved theme when following the system', async () => {
      theme = 'system'
      resolvedTheme = 'dark'
      render(<Toolbar />)
      await userEvent.click(screen.getByTitle('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('light')
    })

    it('flips to dark when following the system in light mode', async () => {
      theme = 'system'
      resolvedTheme = 'light'
      render(<Toolbar />)
      await userEvent.click(screen.getByTitle('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('dark')
    })

    it('flips an explicit dark theme to light', async () => {
      theme = 'dark'
      render(<Toolbar />)
      await userEvent.click(screen.getByTitle('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('light')
    })

    it('flips an explicit light theme to dark', async () => {
      theme = 'light'
      render(<Toolbar />)
      await userEvent.click(screen.getByTitle('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('dark')
    })
  })
})
