import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Navigation } from '../src/components/navigation'
import { useUIStore } from '../src/state'

const setTheme = vi.fn()
let theme = 'system'
let resolvedTheme = 'light'

vi.mock('@react-foundry/style', async () => {
  const actual = await vi.importActual('@react-foundry/style')
  return { ...actual, useTheme: () => ({ theme, resolvedTheme, setTheme }) }
})

describe('Navigation', () => {
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
    render(<Navigation />)
    const toggle = screen.getByTitle('Toggle Component List')

    await userEvent.click(toggle)
    expect(useUIStore.getState().isShelfOpen).toBe(false)

    await userEvent.click(toggle)
    expect(useUIStore.getState().isShelfOpen).toBe(true)
  })

  it('toggles the controls panel open and closed', async () => {
    render(<Navigation />)
    const toggle = screen.getByTitle('Toggle Controls Panel')

    await userEvent.click(toggle)
    expect(useUIStore.getState().isPanelOpen).toBe(false)

    await userEvent.click(toggle)
    expect(useUIStore.getState().isPanelOpen).toBe(true)
  })

  it('toggles accessibility', async () => {
    render(<Navigation />)
    await userEvent.click(screen.getByTitle('Enable Accessibility Check'))

    expect(useUIStore.getState().isAccessibilityEnabled).toBe(true)
  })

  it('reflects accessibility being on in the button title', () => {
    useUIStore.setState({ isAccessibilityEnabled: true })
    render(<Navigation />)

    expect(screen.getByTitle('Disable Accessibility Check')).toBeInTheDocument()
  })

  describe('theme toggle', () => {
    // On `system` the current theme is whatever the OS resolved to, so the
    // toggle has to flip that rather than the stored preference.
    it('flips away from the resolved theme when following the system', async () => {
      theme = 'system'
      resolvedTheme = 'dark'
      render(<Navigation />)
      await userEvent.click(screen.getByTitle('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('light')
    })

    it('flips to dark when following the system in light mode', async () => {
      theme = 'system'
      resolvedTheme = 'light'
      render(<Navigation />)
      await userEvent.click(screen.getByTitle('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('dark')
    })

    it('flips an explicit dark theme to light', async () => {
      theme = 'dark'
      render(<Navigation />)
      await userEvent.click(screen.getByTitle('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('light')
    })

    it('flips an explicit light theme to dark', async () => {
      theme = 'light'
      render(<Navigation />)
      await userEvent.click(screen.getByTitle('Toggle Theme'))

      expect(setTheme).toHaveBeenCalledWith('dark')
    })
  })
})
