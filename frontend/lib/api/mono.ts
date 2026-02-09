import { api } from './client'

export const monoApi = {
  getPublicKey: async (): Promise<{ publicKey: string }> => {
    const response = await api.get('/mono/public-key')
    return response.data
  },

  exchangeToken: async (code: string, applicantId: string): Promise<{ accountId: string;  bankAccount: Record<string, unknown>;  message: string }> => {
    const response = await api.post('/mono/exchange-token', { code, applicantId })
    return response.data
  },
}