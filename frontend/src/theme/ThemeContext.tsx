import React, { createContext, useContext, useEffect, useState } from 'react'
import { Appearance } from 'react-native'
import { lightTheme, darkTheme, ThemeColors } from './colors'
import { Typography } from './typography'
import { spacing, radius } from './spacing'

export type ThemeMode = 'light' | 'dark' | 'system'

export interface ThemeContextType {
  mode: ThemeMode
  theme: ThemeMode // alias for compatibility
  setMode: (mode: ThemeMode) => void
  setTheme: (mode: ThemeMode) => void // alias for compatibility
  colors: ThemeColors
  typography: typeof Typography
  spacing: typeof spacing
  radius: typeof radius
  isDark: boolean
}

const ThemeContext = createContext<ThemeContextType | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>('system')
  const systemIsDark = Appearance.getColorScheme() === 'dark'
  const isDark = mode === 'dark' || (mode === 'system' && systemIsDark)
  const currentTheme = isDark ? darkTheme : lightTheme

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode)
  }

  useEffect(() => {
    const subscription = Appearance.addChangeListener(() => {
      if (mode === 'system') {
        // Trigger re-render by resetting system mode state
        setModeState('system')
      }
    })
    return () => subscription.remove()
  }, [mode])

  const contextValue: ThemeContextType = {
    mode,
    theme: mode,
    setMode,
    setTheme: setMode,
    colors: currentTheme.colors,
    typography: Typography,
    spacing,
    radius,
    isDark,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
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
