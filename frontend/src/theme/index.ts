export { BaseColors, lightTheme, darkTheme } from './colors'
export type { ThemeColors } from './colors'
export { Typography } from './typography'
export { spacing, radius, Spacing, Radius, Elevation } from './spacing'
export { ThemeProvider, useTheme } from './ThemeContext'
export type { ThemeMode } from './ThemeContext'

// Backwards compatible exports for LightTheme / DarkTheme
import { lightTheme, darkTheme } from './colors'
export const LightTheme = lightTheme
export const DarkTheme = darkTheme
export type Theme = typeof lightTheme
