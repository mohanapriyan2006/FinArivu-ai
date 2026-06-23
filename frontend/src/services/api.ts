import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

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
    if (error.response?.status === 401) {
      // Handle unauthorized - navigation will be handled by auth context
    }
    return Promise.reject(error)
  }
)
