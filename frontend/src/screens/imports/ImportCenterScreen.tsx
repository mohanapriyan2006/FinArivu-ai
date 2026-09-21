import React, { useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import * as DocumentPicker from 'expo-document-picker'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import {
  ArrowLeft,
  Building,
  ChevronRight,
  FileText,
  Landmark,
  Receipt,
  TrendingUp,
  Upload,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import type { RootStackParamList } from '@/types/navigation'
import type { ImportDocumentType, ImportStatus, ImportSummary } from '@/types/imports'
import { useImportCenter } from '@/hooks/useImport'

const DOC_LABELS: Record<ImportDocumentType, string> = {
  PAYSLIP: 'Payslip',
  BANK_STATEMENT: 'Bank statement',
  LOAN_STATEMENT: 'Loan statement',
  INVESTMENT_STATEMENT: 'Investment statement',
}

const STATUS_LABELS: Record<ImportStatus, string> = {
  UPLOADED: 'Uploaded',
  PROCESSING: 'Processing',
  REVIEW_REQUIRED: 'Review',
  CONFIRMED: 'Confirmed',
  APPLIED: 'Applied',
  PARTIALLY_APPLIED: 'Partially applied',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

function DocIcon({ type, color }: { type: ImportDocumentType; color: string }) {
  const props = { size: 18, color, strokeWidth: 2 }
  switch (type) {
    case 'PAYSLIP':
      return <Receipt {...props} />
    case 'BANK_STATEMENT':
      return <Landmark {...props} />
    case 'LOAN_STATEMENT':
      return <Building {...props} />
    case 'INVESTMENT_STATEMENT':
      return <TrendingUp {...props} />
  }
}

export default function ImportCenterScreen() {
  const { colors, isDark } = useTheme()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const { state, items, isBusy, refresh, upload } = useImportCenter()
  const [isUploading, setIsUploading] = useState(false)
  const styles = useMemo(() => makeStyles(colors), [colors])

  const statusTint = (status: ImportStatus) => {
    if (status === 'APPLIED') return colors.success
    if (status === 'FAILED' || status === 'CANCELLED') return colors.danger
    if (status === 'REVIEW_REQUIRED') return colors.warning
    return colors.textSecondary
  }

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'text/plain',
          'text/csv',
          'application/octet-stream',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      })
      if (result.canceled || !result.assets?.length) return
      const asset = result.assets[0]
      if ((asset.size ?? 0) > 5 * 1024 * 1024) {
        Alert.alert('File too large', 'Please select a document under 5 MB.')
        return
      }
      setIsUploading(true)
      const batchId = await upload({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
        size: asset.size ?? 0,
      })
      navigation.navigate('ImportReview', { batchId })
    } catch (err) {
      Alert.alert(
        'Import failed',
        err instanceof Error ? err.message : 'The document could not be imported.',
      )
    } finally {
      setIsUploading(false)
    }
  }

  const openBatch = (item: ImportSummary) => {
    navigation.navigate('ImportReview', { batchId: item.id })
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} translucent />

      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2.2} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.textHero }]}>
          Import Center
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isBusy}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        testID="import-center-screen"
      >
        {/* Upload card */}
        <Pressable
          style={[styles.uploadCard, { borderColor: colors.primary }]}
          onPress={handlePick}
          disabled={isUploading}
          accessibilityRole="button"
          accessibilityLabel="Upload a document"
          testID="import-upload-button"
        >
          <View style={[styles.uploadIcon, { backgroundColor: colors.primarySoft }]}>
            {isUploading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Upload size={20} color={colors.primary} strokeWidth={2.2} />
            )}
          </View>
          <View style={styles.uploadTextWrap}>
            <Text style={[styles.uploadTitle, { color: colors.textHero }]}>
              {isUploading ? 'Reading document…' : 'Import a document'}
            </Text>
            <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
              Payslip, bank statement, loan or investment statement (PDF, CSV,
              DOCX, TXT — max 5 MB)
            </Text>
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          HISTORY
        </Text>

        {state.kind === 'loading' ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={styles.loader}
          />
        ) : state.kind === 'error' ? (
          <View
            style={[styles.errorCard, { borderColor: colors.danger }]}
            testID="import-center-error"
          >
            <Text style={[styles.errorText, { color: colors.danger }]}>
              {state.message}
            </Text>
            <Pressable onPress={refresh} accessibilityRole="button">
              <Text style={[styles.retryText, { color: colors.danger }]}>Retry</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View
            style={[styles.emptyCard, { borderColor: colors.border }]}
            testID="import-center-empty"
          >
            <FileText size={28} color={colors.textSecondary} strokeWidth={1.5} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No imports yet
            </Text>
            <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
              Upload a financial document and review what it would change —
              nothing is applied until you confirm it.
            </Text>
          </View>
        ) : (
          items.map((item) => {
            const counts = item.summary?.counts
            return (
              <Pressable
                key={item.id}
                style={[styles.row, { borderColor: colors.border }]}
                onPress={() => openBatch(item)}
                accessibilityRole="button"
                testID={`import-row-${item.id}`}
              >
                <View
                  style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}
                >
                  <DocIcon type={item.documentType} color={colors.primary} />
                </View>
                <View style={styles.rowBody}>
                  <Text
                    style={[styles.rowTitle, { color: colors.textPrimary }]}
                    numberOfLines={1}
                  >
                    {item.fileName || DOC_LABELS[item.documentType]}
                  </Text>
                  <Text
                    style={[styles.rowMeta, { color: colors.textSecondary }]}
                    numberOfLines={1}
                  >
                    {DOC_LABELS[item.documentType]}
                    {counts?.changes ? ` · ${counts.changes} changes` : ''}
                    {counts?.duplicates ? ` · ${counts.duplicates} dupes` : ''}
                  </Text>
                </View>
                <Text
                  style={[styles.statusChip, { color: statusTint(item.status) }]}
                >
                  {STATUS_LABELS[item.status]}
                </Text>
                <ChevronRight size={16} color={colors.textSecondary} />
              </Pressable>
            )
          })
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    backButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 48,
    },
    uploadCard: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderRadius: 16,
      padding: 16,
      gap: 14,
      marginTop: 8,
      backgroundColor: colors.surface,
    },
    uploadIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    uploadTextWrap: { flex: 1 },
    uploadTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
    uploadHint: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      marginTop: 2,
      lineHeight: 16,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.semibold,
      letterSpacing: 1,
      marginTop: 24,
      marginBottom: 10,
    },
    loader: { marginTop: 40 },
    errorCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderRadius: 12,
      padding: 14,
      backgroundColor: colors.dangerTint,
    },
    errorText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      flex: 1,
      marginRight: 12,
    },
    retryText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
    emptyCard: {
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 16,
      padding: 28,
      backgroundColor: colors.surface,
      gap: 8,
    },
    emptyTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
    emptyHint: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      textAlign: 'center',
      lineHeight: 17,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderRadius: 14,
      padding: 12,
      marginBottom: 8,
      backgroundColor: colors.surface,
      gap: 12,
    },
    rowIcon: {
      width: 38,
      height: 38,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowBody: { flex: 1 },
    rowTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.body,
      fontWeight: Typography.fontWeights.semibold,
    },
    rowMeta: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      marginTop: 1,
    },
    statusChip: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.label,
      fontWeight: Typography.fontWeights.semibold,
    },
  })
