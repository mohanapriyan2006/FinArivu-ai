export interface ThemeColors {
  background: string
  surface: string
  primary: string
  primaryDark: string
  heroCard: string
  primaryBackground: string
  accent: string
  accentBackground: string
  accentDark: string
  aiInsightBackground: string
  success: string
  successBackground: string
  warning: string
  danger: string
  dangerBackground: string
  dangerTint: string
  storyCardInner: string
  chatBubbleBorder: string
  chartMuted: string
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
