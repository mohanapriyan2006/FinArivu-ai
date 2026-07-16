import React, { useEffect, useMemo, useState } from 'react'
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import type { StackNavigationProp } from '@react-navigation/stack'
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import {
  Briefcase,
  Car,
  ChevronLeft,
  GraduationCap,
  Heart,
  Home,
  MoreHorizontal,
  Plane,
  Rocket,
  ShieldAlert,
  Sparkles,
} from 'lucide-react-native'

import { useTheme } from '@/contexts/ThemeContext'
import { Typography } from '@/theme'
import type { ThemeColors } from '@/theme'
import { CARD_SHADOW } from '@/components/insights/Common'
import { CategorySelectButton } from '@/components/goals/CategorySelectButton'
import type { RootStackParamList } from '@/navigation/AppNavigator'

const CATEGORIES = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    image:
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'car',
    label: 'Car',
    icon: Car,
    image:
      'https://images.unsplash.com/photo-1503376763036-066120622c74?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'vacation',
    label: 'Vacation',
    icon: Plane,
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'education',
    label: 'Education',
    icon: GraduationCap,
    image:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'marriage',
    label: 'Marriage',
    icon: Heart,
    image:
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'emergency',
    label: 'Emergency Fund',
    icon: ShieldAlert,
    image:
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'custom',
    label: 'Custom',
    icon: MoreHorizontal,
    image:
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=60',
  },
  {
    id: 'retirement',
    label: 'Retirement',
    icon: Briefcase,
    image:
      'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&auto=format&fit=crop&q=60',
  },
]

const START_YEAR = 2024
const END_YEAR = 2034
const TOTAL_YEARS = END_YEAR - START_YEAR
const MONTH_LABEL = 'March'
const THUMB_SIZE = 24
const THUMB_RADIUS = THUMB_SIZE / 2

function chunk<T>(array: T[], size: number): T[][] {
  const result: T[][] = []
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size))
  }
  return result
}

function parseAmount(formatted: string): number {
  return Number(formatted.replace(/[^0-9]/g, '')) || 0
}

function formatAmount(value: number): string {
  return value.toLocaleString('en-IN')
}

export default function CreateGoalScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>()
  const styles = useMemo(() => makeStyles(colors), [colors])

  const [selectedCategoryId, setSelectedCategoryId] = useState('home')
  const [goalName, setGoalName] = useState('New Dream Home')
  const [amount, setAmount] = useState('20,00,000')
  const [selectedIndex, setSelectedIndex] = useState(5)
  const [trackWidth, setTrackWidth] = useState(0)

  const selectedCategory = useMemo(
    () => CATEGORIES.find((c) => c.id === selectedCategoryId) ?? CATEGORIES[0],
    [selectedCategoryId]
  )

  const selectedYear = START_YEAR + selectedIndex
  const yearsFromNow = selectedIndex

  const targetValue = useMemo(() => parseAmount(amount), [amount])

  const monthlySavings = useMemo(() => {
    const months = selectedIndex * 12
    if (months <= 0) return targetValue
    return Math.round(targetValue / months)
  }, [targetValue, selectedIndex])

  const thumbX = useSharedValue(0)
  const fillWidth = useSharedValue(THUMB_RADIUS)

  useEffect(() => {
    if (trackWidth === 0) return
    const innerWidth = trackWidth - THUMB_SIZE
    const step = innerWidth / TOTAL_YEARS
    const x = selectedIndex * step
    thumbX.value = withSpring(x)
    fillWidth.value = withSpring(x + THUMB_RADIUS)
  }, [selectedIndex, trackWidth, thumbX, fillWidth])

  const thumbStyle = useAnimatedStyle(() => ({
    left: thumbX.value,
  }))

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }))

  const handleAmountChange = (text: string) => {
    const digits = text.replace(/[^0-9]/g, '')
    setAmount(digits ? formatAmount(Number(digits)) : '')
  }

  const handleTrackPress = (event: { nativeEvent: { locationX: number } }) => {
    if (trackWidth === 0) return
    const x = event.nativeEvent.locationX
    const innerWidth = trackWidth - THUMB_SIZE
    const step = innerWidth / TOTAL_YEARS
    let index = Math.round((x - THUMB_RADIUS) / step)
    index = Math.max(0, Math.min(TOTAL_YEARS, index))
    setSelectedIndex(index)
  }

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  const categoryRows = useMemo(() => chunk(CATEGORIES, 4), [])
  const yearLabels = [2024, 2026, 2028, 2030, 2032, 2034]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View entering={FadeInUp.delay(0).springify()}>
            <View style={styles.header}>
              <Pressable
                onPress={handleBack}
                style={styles.iconButton}
                accessibilityRole="button"
              >
                <ChevronLeft
                  size={24}
                  color={colors.textPrimary}
                  strokeWidth={2}
                />
              </Pressable>
              <Text style={styles.headerTitle}>Create Goal</Text>
              <View style={styles.iconButton} />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(50).springify()}>
            <Text style={styles.heading}>What are you planning for?</Text>
            <Text style={styles.subheading}>
              Select a category and set your target to get an AI-powered savings
              plan.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(100).springify()}>
            <View style={styles.heroImageCard}>
              <Image
                source={{ uri: selectedCategory.image }}
                style={styles.heroImage}
                resizeMode="cover"
              />
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>
                  {selectedCategory.label} Goal
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(150).springify()}>
            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.gridContainer}>
              {categoryRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.gridRow}>
                  {row.map((category, index) => (
                    <CategorySelectButton
                      key={category.id}
                      icon={category.icon}
                      label={category.label}
                      selected={selectedCategoryId === category.id}
                      onPress={() => setSelectedCategoryId(category.id)}
                      delay={rowIndex * 80 + index * 40}
                    />
                  ))}
                </View>
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(250).springify()}>
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>GOAL NAME</Text>
              <TextInput
                value={goalName}
                onChangeText={setGoalName}
                style={styles.input}
                placeholder="Enter goal name"
                placeholderTextColor={colors.textTertiary}
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>TARGET AMOUNT</Text>
              <View style={styles.amountRow}>
                <Text style={styles.currency}>₹</Text>
                <TextInput
                  value={amount}
                  onChangeText={handleAmountChange}
                  style={[styles.input, styles.amountInput]}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor={colors.textTertiary}
                  autoCorrect={false}
                />
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(350).springify()}>
            <View style={styles.sliderCard}>
              <View style={styles.sliderHeader}>
                <Text style={styles.sliderDate}>
                  {MONTH_LABEL} {selectedYear}
                </Text>
                <Text style={styles.sliderSubtext}>
                  {yearsFromNow} {yearsFromNow === 1 ? 'Year' : 'Years'} from now
                </Text>
              </View>

              <View style={styles.sliderTrackWrapper}>
                <Pressable
                  onPress={handleTrackPress}
                  onLayout={(event) =>
                    setTrackWidth(event.nativeEvent.layout.width)
                  }
                  style={styles.sliderTrack}
                >
                  <Animated.View
                    style={[styles.sliderFill, fillStyle]}
                  />
                  <Animated.View style={[styles.sliderThumb, thumbStyle]}>
                    <View style={styles.sliderThumbInner} />
                  </Animated.View>
                </Pressable>
              </View>

              <View style={styles.yearLabelsRow}>
                {yearLabels.map((year, index) => (
                  <View
                    key={year}
                    style={[
                      styles.yearLabelContainer,
                      index === 0
                        ? { alignItems: 'flex-start' }
                        : index === yearLabels.length - 1
                          ? { alignItems: 'flex-end' }
                          : { alignItems: 'center' },
                    ]}
                  >
                    <Text style={styles.yearLabel}>{year}</Text>
                  </View>
                ))}
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(450).springify()}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryCardLeft}>
                <Text style={styles.summaryLabel}>MONTHLY SAVINGS</Text>
                <Text style={styles.summaryValueLeft}>
                  ₹{formatAmount(monthlySavings)}
                  <Text style={styles.perMonth}>/mo</Text>
                </Text>
              </View>
              <View style={styles.summaryCardRight}>
                <Text style={styles.summaryLabel}>PROJECTED COMPLETION</Text>
                <Text style={styles.summaryValueRight}>
                  {MONTH_LABEL} {selectedYear}
                </Text>
              </View>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(550).springify()}>
            <View style={styles.aiBox}>
              <View style={styles.aiIconWrapper}>
                <Sparkles size={20} color={colors.accent} strokeWidth={2} />
              </View>
              <Text style={styles.aiBody}>
                This goal is{' '}
                <Text
                  style={[
                    styles.aiHighlight,
                    { color: colors.success, fontWeight: Typography.fontWeights.bold },
                  ]}
                >
                  realistic
                </Text>{' '}
                based on your current savings rate. You can reach it{' '}
                <Text
                  style={[
                    styles.aiHighlight,
                    { color: colors.primary, fontWeight: Typography.fontWeights.bold },
                  ]}
                >
                  2 months earlier
                </Text>{' '}
                by increasing your monthly SIP by 10%.
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(650).springify()}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.ctaButton}
              accessibilityRole="button"
            >
              <Rocket
                size={18}
                color="#FFFFFF"
                strokeWidth={2}
                style={styles.ctaIcon}
              />
              <Text style={styles.ctaText}>Create Goal</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      paddingHorizontal: 20,
      paddingTop: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    iconButton: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: 20,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    heading: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes['2xl'],
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 6,
    },
    subheading: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      marginBottom: 24,
      lineHeight: 22,
    },
    heroImageCard: {
      borderRadius: 16,
      overflow: 'hidden',
      height: 192,
      marginBottom: 24,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroBadge: {
      position: 'absolute',
      left: 16,
      bottom: 16,
      backgroundColor: colors.accent,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    heroBadgeText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
    sectionTitle: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginBottom: 12,
    },
    gridContainer: {
      marginBottom: 24,
    },
    gridRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 10,
    },
    inputCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      ...CARD_SHADOW,
    },
    inputLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    input: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textPrimary,
      padding: 0,
    },
    amountRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    currency: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.textPrimary,
      marginRight: 6,
    },
    amountInput: {
      flex: 1,
    },
    sliderCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      ...CARD_SHADOW,
    },
    sliderHeader: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      marginBottom: 24,
    },
    sliderDate: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    sliderSubtext: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
    },
    sliderTrackWrapper: {
      justifyContent: 'center',
    },
    sliderTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      justifyContent: 'center',
    },
    sliderFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    sliderThumb: {
      position: 'absolute',
      top: -8,
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      borderRadius: THUMB_RADIUS,
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sliderThumbInner: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.surface,
    },
    yearLabelsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: THUMB_RADIUS,
      marginTop: 12,
    },
    yearLabelContainer: {
      flex: 1,
    },
    yearLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.medium,
      color: colors.textSecondary,
    },
    summaryRow: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 16,
    },
    summaryCardLeft: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      borderRadius: 16,
      padding: 16,
      ...CARD_SHADOW,
    },
    summaryCardRight: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      ...CARD_SHADOW,
    },
    summaryLabel: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.xs,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 8,
    },
    summaryValueLeft: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    summaryValueRight: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: colors.primary,
    },
    perMonth: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.textSecondary,
    },
    aiBox: {
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      marginBottom: 24,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    aiIconWrapper: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: colors.accentBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },
    aiBody: {
      flex: 1,
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
      fontWeight: Typography.fontWeights.regular,
      color: colors.textSecondary,
      lineHeight: 22,
    },
    aiHighlight: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.sm,
    },
    ctaButton: {
      height: 52,
      borderRadius: 16,
      backgroundColor: colors.primary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    ctaIcon: {
      marginRight: 8,
    },
    ctaText: {
      fontFamily: Typography.fontFamily,
      fontSize: Typography.sizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: colors.surface,
    },
  })
}
