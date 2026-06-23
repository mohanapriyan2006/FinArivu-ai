import { useCallback, useState } from 'react'
import {
  View, Text, StyleSheet, Pressable, FlatList, Modal,
  TextInput, ScrollView, Alert,
} from 'react-native'
import { useAuthContext } from '@/contexts/AuthContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { useTheme } from '@/contexts/ThemeContext'
import {
  BudgetService,
  type Budget,
  type BudgetInput,
  type BudgetAnalysisItem,
} from '@/services/BudgetService'
import { CategoryService, type Category } from '@/services/CategoryService'

function getStatusColor(status: string, colors: any) {
  switch (status) {
    case 'overspent': return colors.danger
    case 'at_risk': return colors.warning
    case 'underutilized': return colors.primary
    case 'on_track': return colors.success
    default: return colors.textSecondary
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'overspent': return 'Over Budget'
    case 'at_risk': return 'At Risk'
    case 'underutilized': return 'Underutilized'
    case 'on_track': return 'On Track'
    default: return status
  }
}

export default function BudgetScreen() {
  const { colors } = useTheme()
  const { getToken } = useAuthContext()
  const queryClient = useQueryClient()
  const styles = makeStyles(colors)

  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Budget | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [monthlyLimit, setMonthlyLimit] = useState('')

  const fetchToken = useCallback(async () => getToken(), [getToken])

  const { data: budgets = [] } = useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const token = await fetchToken()
      return BudgetService.list(token)
    },
  })

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const token = await fetchToken()
      return CategoryService.list(token)
    },
  })

  const { data: analysis } = useQuery({
    queryKey: ['budget-analysis'],
    queryFn: async () => {
      const token = await fetchToken()
      return BudgetService.getAnalysis(token)
    },
  })

  const analysisMap: Record<string, BudgetAnalysisItem> = {}
  analysis?.categories?.forEach((item) => {
    analysisMap[item.category] = item
  })

  const createMutation = useMutation({
    mutationFn: async (data: BudgetInput) => {
      const token = await fetchToken()
      return BudgetService.create(data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget-analysis'] })
      setModalVisible(false)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BudgetInput }) => {
      const token = await fetchToken()
      return BudgetService.update(id, data, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget-analysis'] })
      setModalVisible(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = await fetchToken()
      return BudgetService.delete(id, token)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget-analysis'] })
    },
  })

  const openAdd = () => {
    setEditingItem(null)
    setCategoryId(categories[0]?.id || '')
    setMonthlyLimit('')
    setModalVisible(true)
  }

  const openEdit = (item: Budget) => {
    setEditingItem(item)
    setCategoryId(item.categoryId)
    setMonthlyLimit(String(item.monthlyLimit))
    setModalVisible(true)
  }

  const onSave = () => {
    const numLimit = Number(monthlyLimit)
    if (!categoryId || numLimit <= 0) return

    const payload: BudgetInput = { categoryId, monthlyLimit: numLimit }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  const onDelete = (item: Budget) => {
    Alert.alert('Delete Budget', `Delete budget for ${item.categoryName || 'this category'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(item.id),
      },
    ])
  }

  const summary = analysis?.summary

  const renderItem = ({ item }: { item: Budget }) => {
    const catAnalysis = analysisMap[item.categoryName || '']
    const spent = catAnalysis?.spent || 0
    const usage = catAnalysis?.usage || 0
    const status = catAnalysis?.status || 'on_track'
    const progress = Math.min(usage / 100, 1)
    const statusColor = getStatusColor(status, colors)

    return (
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <View style={styles.cardLeft}>
            <Text style={styles.cardTitle}>{item.categoryName || 'Unknown'}</Text>
            <Text style={styles.cardMeta}>
              Spent: ₹{Number(spent).toLocaleString()} / ₹{Number(item.monthlyLimit).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.chipText, { color: statusColor }]}>
              {getStatusLabel(status)}
            </Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBackground, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progress * 100}%`,
                  backgroundColor: statusColor,
                },
              ]}
            />
          </View>
          <Text style={[styles.progressText, { color: statusColor }]}>{usage.toFixed(0)}%</Text>
        </View>

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
        <Text style={styles.title}>Budgets</Text>
        <Pressable style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      {summary && (
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Budget</Text>
              <Text style={styles.summaryValue}>₹{Number(summary.totalBudget).toLocaleString()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Spent</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]}>
                ₹{Number(summary.totalSpent).toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                ₹{Number(summary.totalRemaining).toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No budgets set yet</Text>
            <Text style={styles.emptySubtext}>Tap + Add to create your first budget</Text>
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
                {editingItem ? 'Edit Budget' : 'Add Budget'}
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Category</Text>
                {categories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      categoryId === cat.id && { backgroundColor: colors.primary },
                    ]}
                    onPress={() => setCategoryId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        categoryId === cat.id && { color: '#FFFFFF' },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Monthly Limit (₹)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={monthlyLimit}
                  onChangeText={setMonthlyLimit}
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
    chip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    chipText: {
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
      flexWrap: 'wrap',
      flexDirection: 'row',
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 6,
      width: '100%',
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
      width: '100%',
    },
    categoryChip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.border,
      marginRight: 8,
      marginBottom: 8,
    },
    categoryChipText: {
      fontSize: 14,
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
