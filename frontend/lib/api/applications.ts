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
}
