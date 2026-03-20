import { api } from './client'

export interface Application {
  id: string
  applicantId: string
  amount: number
  tenor: number
  interestRate: number
  purpose?: string
  status: 'PENDING_LINKING' | 'LINKED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'ABANDONED' | 'MANUAL_REVIEW'
  score?: number
  decision?: Record<string, unknown>
  explanation?: string
  bankAccountIds?: string[]
  approvedAmount?: number
  approvedTenor?: number
  monthlyPayment?: number
  createdAt: string
  updatedAt: string
  processedAt?: string
  applicant?: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    bvn?: string
  }
}

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

export const applicationsApi = {
  getAll: async (status?: string): Promise<Application[]> => {
    const response = await api.get('/applications', {
      params: status ? { status } : undefined,
    })
    return response.data
  },

  getOne: async (id: string): Promise<Application> => {
    const response = await api.get(`/applications/${id}`)
    return response.data
  },

  chat: async (id: string, message: string, history: ChatMessage[]): Promise<string> => {
    const response = await api.post(`/applications/${id}/chat`, { message, history })
    return response.data.reply
  },
}
