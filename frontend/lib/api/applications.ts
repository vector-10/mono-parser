import { api } from './client'

export interface CreateApplicationData {
  applicantId: string
  amount: number
  tenor: number
  interestRate: number
  purpose?: string
}

export interface Application {
  id: string
  applicantId: string
  amount: number
  tenor: number
  interestRate: number
  purpose?: string
  status: 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'PENDING'
  score?: number
  decision?: any
  createdAt: string
  updatedAt: string
  applicant?: {
    id: string
    name: string
    email: string
  }
}

export const applicationsApi = {
  create: async (data: CreateApplicationData): Promise<{ applicationId: string; status: string; message: string }> => {
    const response = await api.post('/applications', data)
    return response.data
  },

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