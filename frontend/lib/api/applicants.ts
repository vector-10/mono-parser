import { api } from './client'

export interface CreateApplicantData {
  firstName: string
  lastName: string
  email: string
  phone?: string
  bvn?: string
}

export interface Applicant {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  bvn?: string
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