export interface User {
  id: string
  email: string
  name: string
  companyName: string
  apiKey: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  actions: {
    setAuth: (user: User, token: string) => void
    logout: () => void
    clearAuth: () => void
  }
}