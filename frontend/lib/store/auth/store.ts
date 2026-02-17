import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, User } from './types'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      actions: {
        setAuth: (user: User, token: string, refreshToken: string) => {
          set({
            user,
            token,
            refreshToken,
            isAuthenticated: true,
          })
        },

        setTokens: (token: string, refreshToken: string) => {
          set({ token, refreshToken })
        },

        logout: () => {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        },

        clearAuth: () => {
          set({
            user: null,
            token: null,
            refreshToken: null,
            isAuthenticated: false,
          })
        },
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
