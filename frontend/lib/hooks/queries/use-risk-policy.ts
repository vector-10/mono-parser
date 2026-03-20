import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { riskPolicyApi, type RiskPolicy } from '@/lib/api/risk-policy'

export function useRiskPolicy() {
  return useQuery({
    queryKey: ['risk-policy'],
    queryFn: riskPolicyApi.get,
  })
}

export function useUpdateRiskPolicy() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<RiskPolicy>) => riskPolicyApi.update(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['risk-policy'] }),
  })
}
