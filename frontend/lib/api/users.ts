import { api } from './client'

export interface UpdateApiKeyData {
  monoApiKey: string
}

export interface User {
  id: string
  email: string
  name: string
  companyName: string
  apiKey: string
  monoApiKey: string | null
  monoPublicKey: string | null 
}

export const usersApi = {
  updateApiKey: async (monoApiKey: string, monoPublicKey: string): Promise<User> => {
    const response = await api.put('/users/api-key', { monoApiKey, monoPublicKey })
    return response.data
  },
}