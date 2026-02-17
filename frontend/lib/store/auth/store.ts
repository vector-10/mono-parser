import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState, User } from './types'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      actions: {
        setAuth: (user: User, token: string) => {
          set({
            user,
            token,
            isAuthenticated: true,
          })
        },

        setToken: (token: string) => {
          set({ token })
        },

        logout: () => {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          })
        },

        clearAuth: () => {
          set({
            user: null,
            token: null,
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
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
