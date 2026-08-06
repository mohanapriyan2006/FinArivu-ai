
# 🎨 theme-color.md — FinArivu AI Theme & Styling System (React Native TS)

This document specifies the theme tokens, color palette, typography hierarchy, and context-driven styling setup for React Native using pure `StyleSheet` (without Tailwind CSS).

---

## 1. Directory Structure

```text
src/theme/
├── colors.ts
├── typography.ts
├── spacing.ts
├── lightTheme.ts
├── darkTheme.ts
├── index.ts
└── ThemeContext.tsx

```

---

## 2. Token Definitions (`colors.ts`, `typography.ts`, `spacing.ts`)

```typescript
// src/theme/colors.ts
export const BaseColors = {
  royalBlue: '#0D47A1',
  indigoPrimary: '#4F46E5',
  darkNavy: '#071C3F',
  financialGold: '#F4B400',
  successGreen: '#22C55E',
  warningOrange: '#F59E0B',
  dangerRed: '#DC2626',
  tealNetWorth: '#14B8A6',
  white: '#FFFFFF',
  black: '#000000',
  slate50: '#F8FAFC',
  slate100: '#F1F5F9',
  slate200: '#E2E8F0',
  slate400: '#94A3B8',
  slate600: '#475569',
  slate800: '#1E293B',
  slate900: '#0F172A',
  darkBg: '#0B1220',
  darkSurface: '#111827',
  darkCard: '#1E293B',
  aiBubbleBg: '#1E1B4B',
  aiBorder: '#4338CA',
} as const;

export interface ColorScheme {
  background: string;
  surface: string;
  card: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryDark: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  chartIncome: string;
  chartExpense: string;
  chartInvestment: string;
  chartGoal: string;
  chartNetWorth: string;
  aiBg: string;
  aiBorder: string;
}

export const LightColors: ColorScheme = {
  background: BaseColors.slate50,
  surface: BaseColors.white,
  card: BaseColors.white,
  border: BaseColors.slate200,
  textPrimary: BaseColors.slate900,
  textSecondary: BaseColors.slate600,
  textMuted: BaseColors.slate400,
  primary: BaseColors.indigoPrimary,
  primaryDark: BaseColors.darkNavy,
  accent: BaseColors.financialGold,
  success: BaseColors.successGreen,
  warning: BaseColors.warningOrange,
  danger: BaseColors.dangerRed,
  chartIncome: BaseColors.successGreen,
  chartExpense: BaseColors.dangerRed,
  chartInvestment: BaseColors.royalBlue,
  chartGoal: BaseColors.financialGold,
  chartNetWorth: BaseColors.tealNetWorth,
  aiBg: '#EEF2FF',
  aiBorder: '#C7D2FE',
};

export const DarkColors: ColorScheme = {
  background: BaseColors.darkBg,
  surface: BaseColors.darkSurface,
  card: BaseColors.darkCard,
  border: '#1F2937',
  textPrimary: BaseColors.slate50,
  textSecondary: BaseColors.slate400,
  textMuted: BaseColors.slate600,
  primary: BaseColors.indigoPrimary,
  primaryDark: BaseColors.darkNavy,
  accent: BaseColors.financialGold,
  success: BaseColors.successGreen,
  warning: BaseColors.warningOrange,
  danger: BaseColors.dangerRed,
  chartIncome: BaseColors.successGreen,
  chartExpense: BaseColors.dangerRed,
  chartInvestment: '#3B82F6',
  chartGoal: BaseColors.financialGold,
  chartNetWorth: BaseColors.tealNetWorth,
  aiBg: BaseColors.aiBubbleBg,
  aiBorder: BaseColors.aiBorder,
};

```

```typescript
// src/theme/typography.ts
import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  hero: {
    fontSize: 34,
    fontWeight: '700',
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h1: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  monoNumeric: {
    fontSize: 18,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
};

```

```typescript
// src/theme/spacing.ts
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const Radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  round: 9999,
} as const;

export const Elevation = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 10,
  },
};

```

---

## 3. Theme Context (`ThemeContext.tsx`)

```typescript
// src/theme/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, ColorScheme } from './colors';
import { Typography } from './typography';
import { Spacing, Radius, Elevation } from './spacing';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  colors: ColorScheme;
  typography: typeof Typography;
  spacing: typeof Spacing;
  radius: typeof Radius;
  elevation: typeof Elevation;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType undefined |>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<ThemeMode>('dark'); // Default dark mode

  const isDark = mode === 'system' ? systemScheme === 'dark' : mode === 'dark';
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider Elevation, Radius, Spacing, Typography, colors, elevation: isDark, mode, radius: setMode, spacing: typography: value="{{" }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

```

```

-----


---

*Made with [Markdown Studio](https://markdownstudio-ai.vercel.app/)*
