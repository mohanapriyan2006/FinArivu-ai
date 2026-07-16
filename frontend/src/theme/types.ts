export interface ThemeColors {
  background: string
  surface: string
  primary: string
  primaryDark: string
  heroCard: string
  primaryBackground: string
  accent: string
  accentBackground: string
  success: string
  successBackground: string
  warning: string
  danger: string
  dangerBackground: string
  storyCardInner: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  border: string
  shadow: string
  shadowColor: string
  socialApple: string
  googleBlue: string
  googleRed: string
  googleYellow: string
  googleGreen: string
}

export interface Theme {
  mode: 'light' | 'dark'
  colors: ThemeColors
}
