import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

import { MOCK_BACKEND, getMockResponse } from './mockApi'

const TOKEN_KEY = 'finarivu_access_token'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api',
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
    const token = await SecureStore.getItemAsync(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
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
    if (error.response?.status === 401) {
      // Handle unauthorized - navigation will be handled by auth context
    }
    return Promise.reject(error)
  }
)
