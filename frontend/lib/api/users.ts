import { api } from './client'

export interface User {
  id: string
  email: string
  name: string
  companyName: string
  webhookUrl?: string | null
  hasApiKey?: boolean
  hasMonoApiKey?: boolean
  hasWebhookSecret?: boolean
}

export const usersApi = {
  updateMonoApiKey: async (monoApiKey: string, monoPublicKey: string): Promise<User> => {
    const response = await api.put('/users/api-key', { monoApiKey, monoPublicKey })
    return response.data
  },

  updateWebhookUrl: async (webhookUrl: string): Promise<{ id: string; webhookUrl: string }> => {
    const response = await api.put('/users/webhook-url', { webhookUrl })
    return response.data
  },

  rotateApiKey: async (): Promise<{ apiKey: string; webhookSecret: string }> => {
    const response = await api.post('/users/rotate-api-key')
    return response.data
  },
}
