import axios from 'axios'
import { useAuthStore } from '@/lib/store/auth'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request Interceptor: Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response Interceptor: Handle 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Logout and redirect
      useAuthStore.getState().actions.logout()
      
      // Only redirect if not already on login/signup page
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/signup')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)