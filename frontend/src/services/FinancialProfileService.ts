import type {
  FinancialProfile,
  ProfileCompletion,
  ProfileSectionId,
  SectionUpdate,
} from '@/types/financialProfile'
import { calculateCompletion, getLastIncompleteSection } from '@/utils/profileCompletion'
import { FinancialProfileStore } from './FinancialProfileStore'

export const FinancialProfileService = {
  async getProfile(userId: string): Promise<FinancialProfile | null> {
    // Future: call FastAPI GET /v1/financial-profile
    return FinancialProfileStore.getProfile(userId)
  },

  async saveProfile(userId: string, profile: FinancialProfile): Promise<void> {
    // Future: call FastAPI PUT /v1/financial-profile
    return FinancialProfileStore.saveProfile(userId, profile)
  },

  async updateProfileSection(
    userId: string,
    update: SectionUpdate
  ): Promise<FinancialProfile> {
    // Future: call FastAPI PATCH /v1/financial-profile/{section}
    return FinancialProfileStore.updateSection(userId, update)
  },

  async getCompletion(userId: string): Promise<ProfileCompletion | null> {
    const profile = await this.getProfile(userId)
    if (!profile) return null
    return calculateCompletion(profile)
  },

  async getLastIncompleteSection(
    userId: string
  ): Promise<ProfileSectionId | null> {
    const profile = await this.getProfile(userId)
    return getLastIncompleteSection(profile)
  },
}
