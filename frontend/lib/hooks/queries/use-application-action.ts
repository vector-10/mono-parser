import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications'

export function useManualDecision(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: 'APPROVE' | 'DECLINE' }) =>
      applicationsApi.manualDecision(id, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      onSuccess?.()
    },
  })
}

export function useFlagForReview(onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => applicationsApi.flagForReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
      onSuccess?.()
    },
  })
}
