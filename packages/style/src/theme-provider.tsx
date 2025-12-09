import { createContext, useEffect, useState, type ReactNode } from 'react'

import { lightTheme, darkTheme } from './themes.css'

export type Theme = 'light' | 'dark' | 'system'

export interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: 'light' | 'dark'
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

interface ThemeProviderProps {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light'
  }

  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getStoredTheme(storageKey: string): Theme | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const stored = localStorage.getItem(storageKey)
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored as Theme
    }
  } catch {
    // Ignore localStorage errors
  }

  return null
}

function setStoredTheme(storageKey: string, theme: Theme): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    localStorage.setItem(storageKey, theme)
  } catch {
    // Ignore localStorage errors
  }
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'react-foundry-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return getStoredTheme(storageKey) ?? defaultTheme
  })

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    return getSystemTheme()
  })

  const resolvedTheme = theme === 'system' ? systemTheme : theme

  useEffect(() => {
    const mediaQuery = matchMedia('(prefers-color-scheme: dark)')

    const handleChange = (e: { matches: boolean }) => {
      setSystemTheme(e.matches ? 'dark' : 'light')
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  useEffect(() => {
    const root = document.documentElement

    // Remove existing theme classes
    root.classList.remove(lightTheme, darkTheme)

    // Add the appropriate theme class
    if (resolvedTheme === 'dark') {
      root.classList.add(darkTheme)
    } else {
      root.classList.add(lightTheme)
    }
  }, [resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    setStoredTheme(storageKey, newTheme)
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}
