import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, Pressable, FlatList, Modal,
  TextInput, ScrollView, Alert,
} from 'react-native'
import { useAuthContext } from '@/contexts/AuthContext'

import { useTheme } from '@/contexts/ThemeContext'
import { IncomeService, type Income, type IncomeInput } from '@/services/IncomeService'

export default function IncomeScreen() {
  const { colors } = useTheme()
  const { getToken } = useAuthContext()
  const [incomeList, setIncomeList] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState<Income | null>(null)
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [incomeDate, setIncomeDate] = useState('')
  const [notes, setNotes] = useState('')
  const styles = makeStyles(colors)

  const today = new Date().toISOString().split('T')[0]

  const loadIncome = useCallback(async () => {
    try {
      const token = await getToken()
      const data = await IncomeService.list(token)
      setIncomeList(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [getToken])

  useEffect(() => {
    loadIncome()
  }, [loadIncome])

  const totalIncome = incomeList.reduce((sum, item) => sum + Number(item.amount), 0)

  const openAdd = () => {
    setEditingItem(null)
    setSource('')
    setAmount('')
    setIncomeDate(today)
    setNotes('')
    setModalVisible(true)
  }

  const openEdit = (item: Income) => {
    setEditingItem(item)
    setSource(item.source)
    setAmount(String(item.amount))
    setIncomeDate(item.incomeDate)
    setNotes(item.notes || '')
    setModalVisible(true)
  }

  const onSave = async () => {
    const numAmount = Number(amount)
    if (!source.trim() || numAmount <= 0 || !incomeDate) return

    const payload: IncomeInput = {
      source: source.trim(),
      amount: numAmount,
      incomeDate,
      notes: notes.trim() || undefined,
    }

    try {
      const token = await getToken()
      if (editingItem) {
        await IncomeService.update(editingItem.id, payload, token)
      } else {
        await IncomeService.create(payload, token)
      }
      setModalVisible(false)
      loadIncome()
    } catch (err) {
      console.error(err)
    }
  }

  const onDelete = (item: Income) => {
    Alert.alert('Delete Income', `Delete "${item.source}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getToken()
            await IncomeService.delete(item.id, token)
            loadIncome()
          } catch (err) {
            console.error(err)
          }
        },
      },
    ])
  }

  const renderItem = ({ item }: { item: Income }) => (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardSource}>{item.source}</Text>
          <Text style={styles.cardDate}>{item.incomeDate}</Text>
        </View>
        <Text style={styles.cardAmount}>+₹{Number(item.amount).toLocaleString()}</Text>
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
        <Text style={styles.title}>Income</Text>
        <Pressable style={styles.addButton} onPress={openAdd}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Monthly Total</Text>
        <Text style={styles.summaryValue}>₹{totalIncome.toLocaleString()}</Text>
      </View>

      <FlatList
        data={incomeList}
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
                {editingItem ? 'Edit Income' : 'Add Income'}
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>Source</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="e.g. Salary, Freelance"
                  placeholderTextColor={colors.textSecondary}
                  value={source}
                  onChangeText={setSource}
                />
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
                <Text style={styles.label}>Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder={today}
                  placeholderTextColor={colors.textSecondary}
                  value={incomeDate}
                  onChangeText={setIncomeDate}
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Notes (optional)</Text>
                <TextInput
                  style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface }]}
                  placeholder="Any notes..."
                  placeholderTextColor={colors.textSecondary}
                  value={notes}
                  onChangeText={setNotes}
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
      backgroundColor: colors.success,
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
    cardSource: {
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
      color: colors.success,
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
