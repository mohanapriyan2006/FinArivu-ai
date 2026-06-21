import { BaseColors } from './colors'
import type { Theme } from './types'

export const LightTheme: Theme = {
  mode: 'light',
  colors: {
    background: BaseColors.backgroundLight,
    surface: BaseColors.surfaceLight,
    primary: BaseColors.primary,
    primaryDark: BaseColors.primaryDark,
    accent: BaseColors.accent,
    success: BaseColors.success,
    warning: BaseColors.warning,
    danger: BaseColors.danger,
    textPrimary: BaseColors.textPrimaryLight,
    textSecondary: BaseColors.textSecondaryLight,
    border: '#E2E8F0',
    shadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  },
}
