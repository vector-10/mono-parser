import { api } from './client'


export interface User {
  id: string
  email: string
  name: string
  companyName: string
  apiKey?: string
  webhookUrl?: string | null
  hasMonoApiKey?: boolean
}

export const usersApi = {
  updateApiKey: async (monoApiKey: string): Promise<User> => {
    const response = await api.put('/users/api-key', { monoApiKey })
    return response.data
  },

  updateWebhookUrl: async (webhookUrl: string): Promise<{ id: string; webhookUrl: string }> => {
    const response = await api.put('/users/webhook-url', { webhookUrl })
    return response.data
  },
}
