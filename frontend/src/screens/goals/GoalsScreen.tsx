import { useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, Pressable, FlatList, Modal,
  TextInput, ScrollView, Alert,
} from 'react-native'
import { useAuth } from '@clerk/clerk-expo'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useTheme } from '@/contexts/ThemeContext'
import {
  GoalService,
  type Goal,
  type GoalInput,
} from '@/services/GoalService'

const GOAL_TYPES = ['House', 'Car', 'Emergency Fund', 'Vacation', 'Marriage', 'Education', 'Custom']

function getProgressColor(progress: number, colors: any) {
  if (progress >= 75) return colors.success
  if (progress >= 50) return colors.primary
  if (progress >= 25) return colors.warning
  return colors.danger
}

export default function GoalsScreen() {
  const { colors } = useTheme()
  const { getToken } = useAuth()
  const queryClient = useQueryClient()
  const styles = makeStyles(colors)

  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Goal | null>(null)
  const [goalName, setGoalName] = useState('')
  const [goalType, setGoalType] = useState('Custom')
  const [targetAmount, setTargetAmount] = useState('')
  const [currentAmount, setCurrentAmount] = useState('')
  const [targetDate, setTargetDate] = useState('')

  const fetchToken = useCallback(async () => getToken(), [getToken])

  const { data: goals = [] } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const token = await fetchToken()
      return GoalService.list(token)
    },
  })

  const { data: summary } = useQuery({
    queryKey: ['goals-summary'],
    queryFn: async () => {
      const token = await fetchToken()
      return GoalService.getSummary(token)
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: GoalInput) => {
      const token = await fetchToken()
      return GoalService.create(data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goals-summary'] })
      setModalVisible(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<GoalInput> }) => {
      const token = await fetchToken()
      return GoalService.update(id, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goals-summary'] })
      setModalVisible(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await fetchToken()
      return GoalService.delete(id, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] })
      queryClient.invalidateQueries({ queryKey: ['goals-summary'] })
    },
  })

  const openAdd = () => {
    setEditingItem(null)
    setGoalName('')
    setGoalType('Custom')
    setTargetAmount('')
    setCurrentAmount('')
    setTargetDate('')
    setModalVisible(true)
  }

  const openEdit = (item: Goal) => {
    setEditingItem(item)
    setGoalName(item.goalName)
    setGoalType(item.goalType)
    setTargetAmount(String(item.targetAmount))
    setCurrentAmount(String(item.currentAmount))
    setTargetDate(item.targetDate)
    setModalVisible(true)
  }

  const onSave = () => {
    const numTarget = Number(targetAmount)
    const numCurrent = Number(currentAmount)
    if (!goalName || numTarget <= 0 || !targetDate) return

    const payload: GoalInput = {
      goalName,
      goalType,
      targetAmount: numTarget,
      currentAmount: numCurrent,
      targetDate,
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const onDelete = (item: Goal) => {
    Alert.alert('Delete Goal', `Delete "${item.goalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item.id),
      },
    ])
  }

  const renderItem = ({ item }: { item: Goal }) => {
    const progress = item.targetAmount > 0
      ? Math.min((item.currentAmount / item.targetAmount) * 100, 100)
      : 0
    const progressColor = getProgressColor(progress, colors)

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle}>{item.goalName}</Text>
            <Text style={styles.cardMeta}>{item.goalType}</Text>
            <Text style={styles.cardMeta}>
              ₹{Number(item.currentAmount).toLocaleString()} / ₹{Number(item.targetAmount).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: progressColor + '20' }]}>
            <Text style={[styles.badgeText, { color: progressColor }]}>
              {item.status}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress}%`,
                  backgroundColor: progressColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: progressColor }]}>{progress.toFixed(0)}%</Text>
        </View>

        <Text style={styles.deadlineText}>Target: {item.targetDate}</Text>

        <View style={styles.cardActions}>
          <Pressable onPress={() => openEdit(item)}>
            <Text style={styles.editText}>Edit</Text>
          </Pressable>
          <Pressable onPress={() => onDelete(item)}>
            <Text style={styles.deleteText}>Delete</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Goals</Text>
        <Pressable style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total</Text>
              <Text style={styles.summaryValue}>{summary.totalGoals}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completed</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{summary.completedGoals}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Avg Progress</Text>
              <Text style={styles.summaryValue}>{summary.averageProgress.toFixed(0)}%</Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={goals}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No goals set yet</Text>
            <Text style={styles.emptySubtext}>Tap + Add to create your first goal</Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Edit Goal' : 'Add Goal'}
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Goal Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="e.g. Buy a House"
                  placeholderTextColor={colors.textSecondary}
                  value={goalName}
                  onChangeText={setGoalName}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Goal Type</Text>
                <View style={styles.typeRow}>
                  {GOAL_TYPES.map((type) => (
                    <Pressable
                      key={type}
                      style={[
                        styles.typeChip,
                        goalType === type && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => setGoalType(type)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          goalType === type && { color: '#FFFFFF' },
                        ]}
                      >
                        {type}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Target Amount (₹)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Current Amount (₹)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={currentAmount}
                  onChangeText={setCurrentAmount}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Target Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="2026-12-31"
                  placeholderTextColor={colors.textSecondary}
                  value={targetDate}
                  onChangeText={setTargetDate}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.saveButton} onPress={onSave}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    addButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 10,
    },
    addButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    summaryCard: {
      marginHorizontal: 20,
      marginBottom: 16,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    summaryItem: {
      flex: 1,
      alignItems: 'center',
    },
    summaryLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    summaryValue: {
      fontSize: 18,
      fontWeight: '700',
      color: colors.textPrimary,
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
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    cardLeft: {
      flex: 1,
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cardMeta: {
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 2,
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
    progressContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 10,
    },
    progressBackground: {
      flex: 1,
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    progressText: {
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 8,
      minWidth: 36,
      textAlign: 'right',
    },
    deadlineText: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 8,
    },
    cardActions: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 12,
    },
    editText: {
      color: colors.primary,
      fontSize: 14,
      fontWeight: '500',
    },
    deleteText: {
      color: colors.danger,
      fontSize: 14,
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
    },
    modalOverlay: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.4)',
    },
    modalContent: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 24,
      maxHeight: '80%',
    },
    modalTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: colors.textPrimary,
      marginBottom: 20,
    },
    field: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    typeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    typeChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.border,
    },
    typeChipText: {
      fontSize: 13,
      fontWeight: '500',
      color: colors.textPrimary,
    },
    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.border,
    },
    cancelButtonText: {
      color: colors.textPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    saveButton: {
      flex: 1,
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      backgroundColor: colors.primary,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  })
}
