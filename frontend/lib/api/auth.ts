import { api } from './client'

export interface SignupData {
    email: string
    password: string
    name: string
    companyName: string
}

export interface LoginData {
    email: string
    password: string
}

export interface VerifyOtpData {
    email: string
    otp: string
}

export interface AuthResponse {
  access_token: string
  user: {
    id: string
    email: string
    name: string
    companyName: string
    apiKey: string
  }
}

export interface SignupResponse {
    message: string 
    email: string
}

export const authApi = {
  signup: async (data: SignupData): Promise<SignupResponse> => {
    const response = await api.post('/auth/signup', data)
    return response.data
  },

  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', data)
    return response.data
  },

  verifyOtp: async (data: VerifyOtpData): Promise<AuthResponse> => {
    const response = await api.post('/auth/verify-otp', data)
    return response.data
  },

  resendOtp: async (email: string): Promise<{ message: string }> => {
    const response = await api.post('/auth/resend-otp', { email })
    return response.data
  },

  getProfile: async () => {
    const response = await api.get('/auth/me')
    return response.data
  },
}