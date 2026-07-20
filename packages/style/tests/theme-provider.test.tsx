import { render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeProvider } from '../src/theme-provider'
import { darkThemeClass, lightThemeClass } from '../src/themes.css'
import { useTheme } from '../src/use-theme'

const STORAGE_KEY = 'react-foundry-theme'

/** Controls what `matchMedia('(prefers-color-scheme: dark)')` reports. */
function stubMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(e: { matches: boolean }) => void>()

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => ({
      matches: prefersDark,
      addEventListener: (_: string, cb: (e: { matches: boolean }) => void) =>
        listeners.add(cb),
      removeEventListener: (_: string, cb: (e: { matches: boolean }) => void) =>
        listeners.delete(cb),
    }))
  )

  return {
    emit: (matches: boolean) => {
      for (const cb of listeners) cb({ matches })
    },
    listenerCount: () => listeners.size,
  }
}

const wrapper = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
)

beforeEach(() => {
  localStorage.clear()
  document.documentElement.className = ''
  stubMatchMedia(false)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useTheme', () => {
  it('throws outside a provider', () => {
    // Silence React's error-boundary console noise for the expected throw.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useTheme())).toThrow(/within a ThemeProvider/)

    spy.mockRestore()
  })

  it('returns the context inside a provider', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('system')
    expect(typeof result.current.setTheme).toBe('function')
  })
})

describe('ThemeProvider initial theme', () => {
  it('defaults to system with nothing stored', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('system')
  })

  it('uses a stored theme', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('dark')
  })

  it('ignores an invalid stored value and falls back to system', () => {
    localStorage.setItem(STORAGE_KEY, 'chartreuse')

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.theme).toBe('system')
  })
})

describe('ThemeProvider resolved theme', () => {
  it('follows the system preference while on system', () => {
    stubMatchMedia(true)

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.resolvedTheme).toBe('dark')
  })

  it('uses the stored theme rather than the system one', () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    stubMatchMedia(true)

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(result.current.resolvedTheme).toBe('light')
  })

  it('reacts to a system preference change while on system', () => {
    const media = stubMatchMedia(false)

    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(result.current.resolvedTheme).toBe('light')

    act(() => media.emit(true))

    expect(result.current.resolvedTheme).toBe('dark')
  })
})

describe('ThemeProvider persistence', () => {
  it('stores the theme when set', () => {
    const { result } = renderHook(() => useTheme(), { wrapper })

    act(() => result.current.setTheme('dark'))

    expect(localStorage.getItem(STORAGE_KEY)).toBe('dark')
    expect(result.current.theme).toBe('dark')
  })

  it('does not throw when localStorage is unavailable', () => {
    const original = Storage.prototype.setItem
    Storage.prototype.setItem = vi.fn(() => {
      throw new Error('QuotaExceeded')
    })

    const { result } = renderHook(() => useTheme(), { wrapper })

    expect(() => act(() => result.current.setTheme('dark'))).not.toThrow()
    expect(result.current.theme).toBe('dark')

    Storage.prototype.setItem = original
  })
})

describe('ThemeProvider dom class', () => {
  it('applies the light class on the document element', () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    render(<ThemeProvider>x</ThemeProvider>)

    expect(document.documentElement).toHaveClass(lightThemeClass)
    expect(document.documentElement).not.toHaveClass(darkThemeClass)
  })

  it('applies the dark class on the document element', () => {
    localStorage.setItem(STORAGE_KEY, 'dark')
    render(<ThemeProvider>x</ThemeProvider>)

    expect(document.documentElement).toHaveClass(darkThemeClass)
    expect(document.documentElement).not.toHaveClass(lightThemeClass)
  })

  it('swaps the class when the theme changes', () => {
    localStorage.setItem(STORAGE_KEY, 'light')
    const { result } = renderHook(() => useTheme(), { wrapper })
    expect(document.documentElement).toHaveClass(lightThemeClass)

    act(() => result.current.setTheme('dark'))

    expect(document.documentElement).toHaveClass(darkThemeClass)
    expect(document.documentElement).not.toHaveClass(lightThemeClass)
  })

  it('renders its children', () => {
    render(<ThemeProvider>content</ThemeProvider>)

    expect(screen.getByText('content')).toBeInTheDocument()
  })
})

describe('ThemeProvider system listener', () => {
  it('removes the media listener on unmount', () => {
    const media = stubMatchMedia(false)

    const { unmount } = render(<ThemeProvider>x</ThemeProvider>)
    expect(media.listenerCount()).toBe(1)

    unmount()

    expect(media.listenerCount()).toBe(0)
  })
})
