export interface ThemeColors {
  background: string
  surface: string
  primary: string
  primaryDark: string
  accent: string
  success: string
  warning: string
  danger: string
  textPrimary: string
  textSecondary: string
  border: string
  shadow: string
}

export interface Theme {
  mode: 'light' | 'dark'
  colors: ThemeColors
}
