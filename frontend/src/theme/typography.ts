import { TextStyle } from 'react-native'

export const Typography = {
  fontFamily: 'Inter',
  fontWeights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extraBold: '800',
  },
  sizes: {
    // New Standard Sizes
    hero: 34,
    h1: 26,
    h2: 20,
    h3: 16,
    body: 14,
    label: 12,
    // Backwards Compatible Sizes
    xxs: 10,
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '2.5xl': 28,
    '3xl': 30,
    '4xl': 36,
    heading: 32,
    score: 48,
    display: 40,
  },
  // Text Presets
  hero: {
    fontFamily: 'Inter',
    fontSize: 34,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,
  h1: {
    fontFamily: 'Inter',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  } as TextStyle,
  h2: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  } as TextStyle,
  h3: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
  } as TextStyle,
  body: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  } as TextStyle,
  label: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  } as TextStyle,
} as const
