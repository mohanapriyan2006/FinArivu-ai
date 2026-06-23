import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, Pressable, FlatList, Modal,
  TextInput, ScrollView, Alert,
} from 'react-native'
import { useAuthContext } from '@/contexts/AuthContext'

import { useTheme } from '@/contexts/ThemeContext'
import { ExpenseService, type Expense, type ExpenseInput } from '@/services/ExpenseService'
import { CategoryService, type Category } from '@/services/CategoryService'

export default function ExpensesScreen() {
  const { colors } = useTheme()
  const { getToken } = useAuthContext()
  const [expenseList, setExpenseList] = useState<Expense[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Expense | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [expenseDate, setExpenseDate] = useState('')
  const styles = makeStyles(colors)

  const today = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async () => {
    try {
      const token = await getToken()
      const [expenses, cats] = await Promise.all([
        ExpenseService.list(token),
        CategoryService.list(token),
      ])
      setExpenseList(expenses)
      setCategories(cats)
    } catch (err) {
      console.error(err)
    }
  }, [getToken])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalExpenses = expenseList.reduce((sum, item) => sum + Number(item.amount), 0)

  const openAdd = () => {
    setEditingItem(null)
    setCategoryId(categories[0]?.id || '')
    setAmount('')
    setDescription('')
    setExpenseDate(today)
    setModalVisible(true)
  }

  const openEdit = (item: Expense) => {
    setEditingItem(item)
    setCategoryId(item.categoryId)
    setAmount(String(item.amount))
    setDescription(item.description || '')
    setExpenseDate(item.expenseDate)
    setModalVisible(true)
  }

  const onSave = async () => {
    const numAmount = Number(amount)
    if (!categoryId || numAmount <= 0 || !expenseDate) return

    const payload: ExpenseInput = {
      categoryId,
      amount: numAmount,
      description: description.trim() || undefined,
      expenseDate,
    }

    try {
      const token = await getToken()
      if (editingItem) {
        await ExpenseService.update(editingItem.id, payload, token)
      } else {
        await ExpenseService.create(payload, token)
      }
      setModalVisible(false)
      loadData()
    } catch (err) {
      console.error(err)
    }
  }

  const onDelete = (item: Expense) => {
    Alert.alert('Delete Expense', `Delete this expense?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken()
            await ExpenseService.delete(item.id, token)
            loadData()
          } catch (err) {
            console.error(err)
          }
        },
      },
    ])
  }

  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name || 'Unknown'

  const renderItem = ({ item }: { item: Expense }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardDesc}>{item.description || getCategoryName(item.categoryId)}</Text>
          <Text style={styles.cardDate}>{item.expenseDate} · {getCategoryName(item.categoryId)}</Text>
        </View>
        <Text style={styles.cardAmount}>-₹{Number(item.amount).toLocaleString()}</Text>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <Pressable style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Monthly Total</Text>
        <Text style={styles.summaryValue}>₹{totalExpenses.toLocaleString()}</Text>
      </View>

      <FlatList
        data={expenseList}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
                {editingItem ? 'Edit Expense' : 'Add Expense'}
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
                <Text style={styles.label}>Amount</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="0"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Description (optional)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="e.g. Grocery shopping"
                  placeholderTextColor={colors.textSecondary}
                  value={description}
                  onChangeText={setDescription}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder={today}
                  placeholderTextColor={colors.textSecondary}
                  value={expenseDate}
                  onChangeText={setExpenseDate}
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
      backgroundColor: colors.danger,
      borderRadius: 16,
      padding: 20,
    },
    summaryLabel: {
      fontSize: 14,
      color: '#FFFFFF',
      opacity: 0.9,
    },
    summaryValue: {
      fontSize: 28,
      fontWeight: '700',
      color: '#FFFFFF',
      marginTop: 4,
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
      alignItems: 'center',
    },
    cardLeft: {
      flex: 1,
    },
    cardDesc: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textPrimary,
    },
    cardDate: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    cardAmount: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.danger,
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
