import { api } from './client'

export interface RiskPolicy {
  id?: string | null
  fintechId?: string
  scoreRejectFloor: number
  scoreManualFloor: number
  scoreApproveFloor: number
  manualReviewBuffer: number
  highValueThreshold: number
  affordabilityCap: number
  minViableOfferRatio: number
  thinFileIncomeMultiple: number
  thinFileMaxTenor: number
  minimumMonthlyIncome: number
  incomeStalenessdays: number
  minAccountAgeMonths: number
  maxOverdrafts: number
  maxBouncedPayments: number
  maxConsecutiveFailures: number
}

export const riskPolicyApi = {
  get: async (): Promise<RiskPolicy> => {
    const response = await api.get('/risk-policy')
    return response.data
  },

  update: async (data: Partial<RiskPolicy>): Promise<RiskPolicy> => {
    const response = await api.put('/risk-policy', data)
    return response.data
  },
}
