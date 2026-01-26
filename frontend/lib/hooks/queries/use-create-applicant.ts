import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applicantsApi, CreateApplicantData } from '@/lib/api/applicants'

export function useCreateApplicant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateApplicantData) => applicantsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
    },
  })
}