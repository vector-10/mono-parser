import { api } from './client'


export interface User {
  id: string
  email: string
  name: string
  companyName: string
  monoApiKey?: string | null
}

export const usersApi = {
  updateApiKey: async (monoApiKey: string): Promise<User> => {
    const response = await api.put('/users/api-key', { monoApiKey })
    return response.data
  },
}