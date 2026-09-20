export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
  errorCode: string | null
}

export * from './financialProfile'
export * from './copilot'
export * from './navigation'
