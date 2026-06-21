import { useCallback } from 'react'
import {
  View, Text, StyleSheet, Pressable, FlatList,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useTheme } from '@/contexts/ThemeContext'
import { InsightService, type Insight } from '@/services/InsightService'

function getPriorityColor(priority: string, colors: any) {
  switch (priority) {
    case 'high': return colors.danger
    case 'medium': return colors.warning
    case 'low': return colors.success
    default: return colors.textSecondary
  }
}

function getPriorityLabel(priority: string) {
  switch (priority) {
    case 'high': return 'High Priority'
    case 'medium': return 'Medium Priority'
    case 'low': return 'Low Priority'
    default: return priority
  }
}

export default function InsightsScreen() {
  const { colors } = useTheme()
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const styles = makeStyles(colors)

  const fetchToken = useCallback(async () => getToken(), [getToken])

  const { data: insights = [], isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: async () => {
      const token = await fetchToken()
      return InsightService.list(token)
    },
  })

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await fetchToken()
      return InsightService.markRead(id, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] })
    },
  })

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const token = await fetchToken()
      return InsightService.markAllRead(token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['insights'] })
    },
  })

  const renderItem = ({ item }: { item: Insight }) => {
    const priorityColor = getPriorityColor(item.priority, colors)

    return (
      <Pressable
        style={[styles.card, item.isRead && styles.cardRead]}
        onPress={() => markReadMutation.mutate(item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.badgeText, { color: priorityColor }]}>
              {getPriorityLabel(item.priority)}
            </Text>
          </View>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>

        <Text style={[styles.titleText, item.isRead && styles.textRead]}>
          {item.title}
        </Text>
        <Text style={[styles.descText, item.isRead && styles.textRead]}>
          {item.description}
        </Text>

        <View style={styles.actionBox}>
          <Text style={styles.actionLabel}>Recommended Action:</Text>
          <Text style={styles.actionText}>{item.action}</Text>
        </View>
      </Pressable>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        {insights.length > 0 && (
          <Pressable style={styles.clearButton} onPress={() => markAllReadMutation.mutate()}>
            <Text style={styles.clearButtonText}>Mark All Read</Text>
          </Pressable>
        )}
      </View>

      <FlatList
        data={insights}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isLoading ? 'Loading insights...' : 'No insights yet'}
            </Text>
            {!isLoading && (
              <Text style={styles.emptySubtext}>
                Insights will appear here based on your financial activity
              </Text>
            )}
          </View>
        }
      />
    </View>
  )
}

function makeStyles(colors: any) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    clearButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 10,
    },
    clearButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    list: {
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardRead: {
      opacity: 0.7,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
    },
    categoryText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    titleText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 6,
    },
    textRead: {
      color: colors.textSecondary,
    },
    descText: {
      fontSize: 14,
      color: colors.textSecondary,
      marginBottom: 12,
      lineHeight: 20,
    },
    actionBox: {
      backgroundColor: colors.background,
      borderRadius: 10,
      padding: 12,
    },
    actionLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    actionText: {
      fontSize: 13,
      color: colors.textPrimary,
      fontWeight: '500',
    },
    emptyState: {
      alignItems: 'center',
      marginTop: 60,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    emptySubtext: {
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 8,
      textAlign: 'center',
      paddingHorizontal: 40,
    },
  })
}
