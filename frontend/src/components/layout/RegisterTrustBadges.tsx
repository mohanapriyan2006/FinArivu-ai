import { useTheme } from '@/contexts/ThemeContext'
import { Lock, BarChart3, Sparkles } from 'lucide-react-native'

import { TrustBadgeCard } from './TrustBadgeCard'

export function RegisterTrustBadges() {
  const { colors } = useTheme()

  return (
    <>
      <TrustBadgeCard
        icon={Lock}
        iconColor={colors.primary}
        iconBackground={colors.primaryBackground}
        title="Bank-grade encryption"
        subtitle="AES-256 bit security protocols."
      />
      <TrustBadgeCard
        icon={BarChart3}
        iconColor={colors.success}
        iconBackground={colors.successBackground}
        title="Private financial analytics"
        subtitle="Your data, completely anonymized."
      />
      <TrustBadgeCard
        icon={Sparkles}
        iconColor={colors.accent}
        iconBackground={colors.accentBackground}
        title="AI-powered insights"
        subtitle="Optimized growth strategies."
      />
    </>
  )
}
