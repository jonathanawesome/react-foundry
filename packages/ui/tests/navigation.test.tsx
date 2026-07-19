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
      isShelfPinned: true,
      isPanelOpen: true,
      isPanelPinned: true,
      expandedNodes: [],
    })
  })

  it('toggles the controls panel', async () => {
    render(<Navigation />)
    await userEvent.click(screen.getByTitle('Toggle Controls Panel'))

    expect(useUIStore.getState().isPanelOpen).toBe(false)
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

  describe('pin button', () => {
    it('is hidden while the shelf is pinned', () => {
      useUIStore.setState({ isShelfOpen: true, isShelfPinned: true })
      render(<Navigation />)

      expect(screen.queryByTitle('Pin shelf')).not.toBeInTheDocument()
    })

    it('is hidden while the shelf is closed', () => {
      useUIStore.setState({ isShelfOpen: false, isShelfPinned: false })
      render(<Navigation />)

      expect(screen.queryByTitle('Pin shelf')).not.toBeInTheDocument()
    })

    it('appears when the shelf is open but unpinned, and pins it', async () => {
      useUIStore.setState({ isShelfOpen: true, isShelfPinned: false })
      render(<Navigation />)

      await userEvent.click(screen.getByTitle('Pin shelf'))

      expect(useUIStore.getState().isShelfPinned).toBe(true)
    })
  })

  describe('shelf button', () => {
    // Pinned means visible, so the same button has to unpin and close.
    it('unpins and closes when the shelf is pinned', async () => {
      useUIStore.setState({ isShelfOpen: true, isShelfPinned: true })
      render(<Navigation />)

      await userEvent.click(screen.getByTitle('Open Component List'))

      expect(useUIStore.getState().isShelfPinned).toBe(false)
      expect(useUIStore.getState().isShelfOpen).toBe(false)
    })

    it('only toggles openness when the shelf is unpinned', async () => {
      useUIStore.setState({ isShelfOpen: false, isShelfPinned: false })
      render(<Navigation />)

      await userEvent.click(screen.getByTitle('Open Component List'))

      expect(useUIStore.getState().isShelfOpen).toBe(true)
      expect(useUIStore.getState().isShelfPinned).toBe(false)
    })
  })
})
