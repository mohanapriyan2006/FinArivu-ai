export const BaseColors = {
  primary: '#5B4EFA',
  primarySoft: '#EBEBFF',
  secondary: '#3B82F6',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#F43F5E',
  backgroundLight: '#FAFAFF',
  surfaceLight: '#FFFFFF',
  borderLight: '#E2E6FA',
  backgroundDark: '#090A10',
  surfaceDark: '#121420',
  borderDark: '#23263B',
  textHeroLight: '#0B112B',
  textPrimaryLight: '#1E293B',
  textSecondaryLight: '#64748B',
  textHeroDark: '#FFFFFF',
  textPrimaryDark: '#E2E8F0',
  textSecondaryDark: '#8B949E',
} as const

export interface ThemeColors {
  background: string
  surface: string
  border: string
  primary: string
  primarySoft: string
  secondary: string
  success: string
  warning: string
  danger: string
  textHero: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  primaryBackground: string
  chatBubbleBorder: string
  // Additional backwards-compatible fields
  primaryDark: string
  heroCard: string
  accent: string
  accentBackground: string
  accentDark: string
  aiInsightBackground: string
  successBackground: string
  dangerBackground: string
  dangerTint: string
  storyCardInner: string
  storyGreen: string
  storyPurple: string
  storyLightPurple: string
  storyBlack: string
  chartMuted: string
  shadow: string
  shadowColor: string
  socialApple: string
  googleBlue: string
  googleRed: string
  googleYellow: string
  googleGreen: string
}

export const lightTheme: { mode: 'light'; colors: ThemeColors } = {
  mode: 'light',
  colors: {
    background: BaseColors.backgroundLight,
    surface: BaseColors.surfaceLight,
    border: BaseColors.borderLight,
    primary: BaseColors.primary,
    primarySoft: BaseColors.primarySoft,
    secondary: BaseColors.secondary,
    success: BaseColors.success,
    warning: BaseColors.warning,
    danger: BaseColors.danger,
    textHero: BaseColors.textHeroLight,
    textPrimary: BaseColors.textPrimaryLight,
    textSecondary: BaseColors.textSecondaryLight,
    textTertiary: BaseColors.textSecondaryLight,
    primaryBackground: BaseColors.primarySoft,
    chatBubbleBorder: BaseColors.borderLight,
    // Backwards compatible mappings
    primaryDark: BaseColors.textHeroLight,
    heroCard: BaseColors.primary,
    accent: BaseColors.warning,
    accentBackground: '#FEF8E7',
    accentDark: '#B8860B',
    aiInsightBackground: '#FFFBED',
    successBackground: '#DCFCE7',
    dangerBackground: '#FEE2E2',
    dangerTint: '#FEF2F2',
    storyCardInner: '#1E5AB8',
    storyGreen: '#064E3B',
    storyPurple: '#4C1D95',
    storyLightPurple: '#F5F3FF',
    storyBlack: '#000000',
    chartMuted: '#D3E4FD',
    shadow: 'rgba(0, 0, 0, 0.05)',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    socialApple: BaseColors.textHeroLight,
    googleBlue: '#4285F4',
    googleRed: '#EA4335',
    googleYellow: '#FBBC05',
    googleGreen: '#34A853',
  },
}

export const darkTheme: { mode: 'dark'; colors: ThemeColors } = {
  mode: 'dark',
  colors: {
    background: BaseColors.backgroundDark,
    surface: BaseColors.surfaceDark,
    border: BaseColors.borderDark,
    primary: BaseColors.primary,
    primarySoft: 'rgba(91, 78, 250, 0.15)', // transparent primary fallback
    secondary: BaseColors.secondary,
    success: BaseColors.success,
    warning: BaseColors.warning,
    danger: BaseColors.danger,
    textHero: BaseColors.textHeroDark,
    textPrimary: BaseColors.textPrimaryDark,
    textSecondary: BaseColors.textSecondaryDark,
    textTertiary: BaseColors.textSecondaryDark,
    primaryBackground: 'rgba(91, 78, 250, 0.1)',
    chatBubbleBorder: BaseColors.borderDark,
    // Backwards compatible mappings
    primaryDark: BaseColors.backgroundDark,
    heroCard: '#083A96',
    accent: BaseColors.warning,
    accentBackground: '#2A2310',
    accentDark: '#B8860B',
    aiInsightBackground: '#2A2310',
    successBackground: '#0E2A18',
    dangerBackground: '#DC2626',
    dangerTint: '#DC2626',
    storyCardInner: '#1E5AB8',
    storyGreen: '#064E3B',
    storyPurple: '#4C1D95',
    storyLightPurple: '#F5F3FF',
    storyBlack: '#000000',
    chartMuted: '#334155',
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowColor: 'rgba(0, 0, 0, 0.4)',
    socialApple: BaseColors.textHeroDark,
    googleBlue: '#4285F4',
    googleRed: '#EA4335',
    googleYellow: '#FBBC05',
    googleGreen: '#34A853',
  },
}
