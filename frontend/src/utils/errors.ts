import axios from 'axios'

export interface ApiErrorInfo {
  message: string
  code?: string
  status?: number
  isNetworkError: boolean
}

/**
 * Extract a user-friendly message from an axios/API error.
 * Backend error shape: { success: false, message, errors: { code, details } }
 */
export function getApiError(error: unknown, fallback = 'Something went wrong. Please try again.'): ApiErrorInfo {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status
    const body = error.response?.data as
      | { message?: string; errors?: { code?: string } }
      | undefined

    if (!error.response) {
      return {
        message: 'Unable to reach the server. Check your connection and try again.',
        code: 'NETWORK_ERROR',
        isNetworkError: true,
      }
    }

    return {
      message: body?.message || fallback,
      code: body?.errors?.code,
      status,
      isNetworkError: false,
    }
  }

  if (error instanceof Error && error.message) {
    return { message: error.message, isNetworkError: false }
  }

  return { message: fallback, isNetworkError: false }
}

export function getErrorMessage(error: unknown, fallback?: string): string {
  return getApiError(error, fallback).message
}
