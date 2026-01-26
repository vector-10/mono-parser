import { api } from './client'

export interface CreateApplicantData {
  name: string
  email: string
  phone: string
  accountId: string
}

export interface Applicant {
  id: string
  name: string
  email: string
  phone: string
  accountId: string
  createdAt: string
}

export const applicantsApi = {
  create: async (data: CreateApplicantData): Promise<Applicant> => {
    const response = await api.post('/applicants/create', data)
    return response.data
  },

  getAll: async (): Promise<Applicant[]> => {
    const response = await api.get('/applicants/all')
    return response.data
  },

  getOne: async (id: string): Promise<Applicant> => {
    const response = await api.get(`/applicants/${id}`)
    return response.data
  },
}