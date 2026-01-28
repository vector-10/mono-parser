import { api } from './client'

export const geminiApi = {
  explainResults: async (applicationId: string): Promise<{ explanation: string }> => {
    const response = await api.get(`/applications/${applicationId}/explain`)
    return response.data
  },
}