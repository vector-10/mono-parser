import { useQuery } from '@tanstack/react-query'
import { applicantsApi } from '@/lib/api/applicants'

export function useApplicant(id: string | null) {
  return useQuery({
    queryKey: ['applicant', id],
    queryFn: () => applicantsApi.getOne(id!),
    enabled: !!id,
  })
}