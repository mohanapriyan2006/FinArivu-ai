import React, { createContext, useContext, useEffect, useState } from 'react'
import { Appearance } from 'react-native'

import { LightTheme, DarkTheme } from '@/theme'
import type { Theme, ThemeMode } from '@/theme'

interface ThemeContextType {
  theme: ThemeMode
  setTheme: (mode: ThemeMode) => void
  colors: Theme['colors']
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('system')
  const systemIsDark = Appearance.getColorScheme() === 'dark'
  const isDark = theme === 'dark' || (theme === 'system' && systemIsDark)
  const colors = isDark ? DarkTheme.colors : LightTheme.colors

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (theme === 'system') {
        // Force re-render when system theme changes
        setTheme('system')
      }
    })
    return () => subscription.remove()
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
