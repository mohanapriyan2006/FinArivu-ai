import { BaseColors } from './colors'
import type { Theme } from './types'

export const LightTheme: Theme = {
  mode: 'light',
  colors: {
    background: BaseColors.backgroundLight,
    surface: BaseColors.surfaceLight,
    primary: BaseColors.primary,
    primaryDark: BaseColors.primaryDark,
    heroCard: BaseColors.heroCard,
    primaryBackground: BaseColors.primaryLight,
    accent: BaseColors.accent,
    accentBackground: BaseColors.accentLight,
    success: BaseColors.success,
    successBackground: BaseColors.successLight,
    warning: BaseColors.warning,
    danger: BaseColors.danger,
    dangerBackground: BaseColors.dangerLight,
    dangerTint: BaseColors.dangerTint,
    storyCardInner: BaseColors.storyCardInner,
    textPrimary: BaseColors.textPrimaryLight,
    textSecondary: BaseColors.textSecondaryLight,
    textTertiary: BaseColors.textTertiaryLight,
    border: BaseColors.borderLight,
    shadow: BaseColors.shadowLight,
    shadowColor: BaseColors.shadowColorLight,
    socialApple: BaseColors.socialAppleLight,
    googleBlue: BaseColors.googleBlue,
    googleRed: BaseColors.googleRed,
    googleYellow: BaseColors.googleYellow,
    googleGreen: BaseColors.googleGreen,
  },
}
