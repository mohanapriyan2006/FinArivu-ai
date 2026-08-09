import React, { useMemo } from 'react'
import { Platform, StyleSheet, TextStyle, ViewStyle } from 'react-native'
import Markdown from 'react-native-markdown-display'

import { useTheme } from '@/contexts/ThemeContext'
import { ThemeColors, Typography } from '@/theme'

interface MarkdownMessageProps {
  content: string
}

type MarkdownRuleStyle = TextStyle | ViewStyle

function makeMarkdownStyles(colors: ThemeColors): Record<string, MarkdownRuleStyle> {
  return {
    body: {
      padding: 0,
      margin: 0,
    },
    text: {
      color: colors.textPrimary,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      lineHeight: 22,
      fontWeight: '400',
    },
    paragraph: {
      marginTop: 4,
      marginBottom: 8,
      flexWrap: 'wrap',
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      width: '100%',
    },
    heading1: {
      color: colors.textHero,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h1,
      fontWeight: '700',
      lineHeight: 32,
      marginTop: 16,
      marginBottom: 8,
    },
    heading2: {
      color: colors.textHero,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h2,
      fontWeight: '600',
      lineHeight: 26,
      marginTop: 14,
      marginBottom: 6,
    },
    heading3: {
      color: colors.textHero,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.h3,
      fontWeight: '600',
      lineHeight: 22,
      marginTop: 12,
      marginBottom: 4,
    },
    heading4: {
      color: colors.textHero,
      fontFamily: Typography.fontFamily,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
      marginTop: 10,
      marginBottom: 4,
    },
    heading5: {
      color: colors.textHero,
      fontFamily: Typography.fontFamily,
      fontSize: 14,
      fontWeight: '600',
      lineHeight: 18,
      marginTop: 8,
      marginBottom: 2,
    },
    heading6: {
      color: colors.textHero,
      fontFamily: Typography.fontFamily,
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 16,
      marginTop: 6,
      marginBottom: 2,
    },
    strong: {
      color: colors.textHero,
      fontWeight: '700',
    },
    em: {
      fontStyle: 'italic',
      color: colors.textPrimary,
    },
    s: {
      textDecorationLine: 'line-through',
      color: colors.textTertiary,
    },
    link: {
      color: colors.secondary,
      textDecorationLine: 'none',
    },
    blocklink: {
      color: colors.secondary,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondary,
    },
    blockquote: {
      backgroundColor: colors.surface,
      borderLeftWidth: 4,
      borderLeftColor: colors.primary,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginVertical: 8,
      borderRadius: 8,
    },
    hr: {
      backgroundColor: colors.border,
      height: 1,
      marginVertical: 12,
      width: '100%',
    },
    bullet_list: {
      marginVertical: 4,
    },
    ordered_list: {
      marginVertical: 4,
    },
    bullet_list_icon: {
      color: colors.textPrimary,
      marginLeft: 4,
      marginRight: 8,
    },
    ordered_list_icon: {
      color: colors.textPrimary,
      marginLeft: 4,
      marginRight: 8,
    },
    list_item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginVertical: 2,
    },
    code_inline: {
      backgroundColor: colors.primaryBackground,
      borderRadius: 6,
      paddingHorizontal: 5,
      paddingVertical: 2,
      fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
    },
    code_block: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
      marginVertical: 8,
    },
    fence: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 12,
      fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }),
      color: colors.textPrimary,
      fontSize: 13,
      lineHeight: 18,
      marginVertical: 8,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginVertical: 8,
    },
    thead: {},
    tbody: {},
    tr: {
      borderBottomWidth: 1,
      borderColor: colors.border,
      flexDirection: 'row',
    },
    th: {
      flex: 1,
      padding: 8,
      backgroundColor: colors.primaryBackground,
      color: colors.textHero,
      fontWeight: '600',
    },
    td: {
      flex: 1,
      padding: 8,
      color: colors.textPrimary,
    },
  }
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const { colors } = useTheme()
  const markdownStyles = useMemo(() => makeMarkdownStyles(colors), [colors])

  return (
    <Markdown style={markdownStyles as StyleSheet.NamedStyles<unknown>}>
      {content}
    </Markdown>
  )
}
