import React, { useCallback, useMemo, useRef, useState } from 'react'
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useTheme } from '@/contexts/ThemeContext'
import { useCopilot } from '@/hooks/useCopilot'
import { CopilotHeader } from '@/components/chatbot/CopilotHeader'
import { CopilotWelcome } from '@/components/chatbot/CopilotWelcome'
import {
  DocMessageItem,
  type ChatMessageItemData,
  type SuggestedAction,
} from '@/components/chatbot/DocMessageItem'
import { CopilotInput } from '@/components/chatbot/CopilotInput'
import { ThinkingAnimation } from '@/components/chatbot/ThinkingAnimation'

export default function CopilotScreen({ navigation }: any) {
  const { colors } = useTheme()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const {
    messages,
    isLoading,
    isStreaming,
    thinkingStep,
    isOnline,
    sendMessage,
    loadHistory,
  } = useCopilot()

  const [inputText, setInputText] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  const flatListRef = useRef<FlatList>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100)
  }, [])

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = (textToSend || inputText).trim()
      if (!text) return

      setInputText('')
      Keyboard.dismiss()
      await sendMessage(text)
      scrollToBottom()
    },
    [inputText, sendMessage, scrollToBottom]
  )

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await loadHistory()
    setRefreshing(false)
  }, [loadHistory])

  const handleAction = useCallback(
    (action: SuggestedAction) => {
      if (action.type === 'CHAT_FOLLOWUP') {
        handleSendMessage((action.payload?.question as string) || action.label)
      } else if (action.type === 'NAVIGATE') {
        const screen = action.payload?.screen as string | undefined
        const params = (action.payload?.params as Record<string, any>) || undefined
        if (screen) {
          navigation.navigate(screen as never, params as never)
        }
      }
      // API_ACTION not yet implemented
    },
    [handleSendMessage, navigation]
  )

  const renderItem = useCallback(
    ({ item }: { item: ChatMessageItemData }) => (
      <DocMessageItem
        item={item}
        onSelectFollowUp={(chipText) => handleSendMessage(chipText)}
        onSelectAction={handleAction}
      />
    ),
    [handleAction, handleSendMessage]
  )

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        <CopilotHeader
          onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
          isOnline={isOnline}
        />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {messages.length === 0 ? (
            <CopilotWelcome
              onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
            />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={scrollToBottom}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={colors.primary}
                />
              }
              ListFooterComponent={
                isLoading || isStreaming ? (
                  <ThinkingAnimation stepText={thinkingStep} />
                ) : null
              }
            />
          )}

          <CopilotInput
            value={inputText}
            onChangeText={setInputText}
            onSend={() => handleSendMessage()}
            disabled={isLoading || isStreaming}
          />
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  )
}

const makeStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    listContent: {
      paddingVertical: 16,
      paddingBottom: 150,
    },
  })
