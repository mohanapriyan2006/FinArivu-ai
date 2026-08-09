import AsyncStorage from '@react-native-async-storage/async-storage'

const AVATAR_PREFIX = 'finarivu_avatar_'

function getKey(userId: string): string {
  return `${AVATAR_PREFIX}${userId}`
}

/**
 * In-memory fallback used when AsyncStorage is unavailable (e.g. web platform
 * without the native module).
 */
const memoryStore: Record<string, string> = {}

async function safeGetItem(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key)
  } catch {
    return memoryStore[key] ?? null
  }
}

async function safeSetItem(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value)
  } catch {
    memoryStore[key] = value
  }
}

export const AvatarStore = {
  async getAvatarUrl(userId: string): Promise<string | null> {
    return safeGetItem(getKey(userId))
  },

  async saveAvatarUrl(userId: string, url: string): Promise<void> {
    return safeSetItem(getKey(userId), url)
  },
}
