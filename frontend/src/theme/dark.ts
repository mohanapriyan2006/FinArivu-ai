import { BaseColors } from './colors'
import type { Theme } from './types'

export const DarkTheme: Theme = {
  mode: 'dark',
  colors: {
    background: BaseColors.backgroundDark,
    surface: BaseColors.surfaceDark,
    primary: BaseColors.primary,
    primaryDark: BaseColors.primaryDark,
    accent: BaseColors.accent,
    success: BaseColors.success,
    warning: BaseColors.warning,
    danger: BaseColors.danger,
    textPrimary: BaseColors.textPrimaryDark,
    textSecondary: BaseColors.textSecondaryDark,
    border: '#1E293B',
    shadow: '0 4px 6px -1px rgb(0 0 0 / 0.5)',
  },
}
