import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

import { MOCK_BACKEND, getMockResponse } from './mockApi'

export const ACCESS_TOKEN_KEY = 'finarivu_access_token'
export const REFRESH_TOKEN_KEY = 'finarivu_refresh_token'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

const refreshApi = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

api.interceptors.request.use(
  async (config) => {
    if (MOCK_BACKEND) {
      const mockError = new Error('MOCK') as any
      mockError.__mock = true
      mockError.config = config
      return Promise.reject(mockError)
    }
    if (!config.headers.Authorization) {
      const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

async function doRefresh() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY)
  if (!refreshToken) {
    throw new Error('No refresh token')
  }

  const response = await refreshApi.post(
    '/v1/auth/refresh',
    {},
    { headers: { Authorization: `Bearer ${refreshToken}` } }
  )
  const data = response.data?.data
  const newAccessToken = data?.accessToken
  if (!newAccessToken) {
    throw new Error('Refresh failed')
  }
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, newAccessToken)
  return newAccessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.__mock && error.config) {
      return Promise.resolve({
        data: getMockResponse(error.config),
        status: 200,
        statusText: 'OK',
        headers: {},
        config: error.config,
        request: {},
      })
    }

    const originalRequest = error.config
    if (error.response?.status === 401 && originalRequest && !originalRequest.__retry) {
      originalRequest.__retry = true

      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(api(originalRequest))
          })
        })
      }

      isRefreshing = true
      try {
        const newAccessToken = await doRefresh()
        onRefreshed(newAccessToken)
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch {
        await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY)
        await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)
