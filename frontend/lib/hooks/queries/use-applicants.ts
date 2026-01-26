import { useQuery } from '@tanstack/react-query'
import { applicantsApi } from '@/lib/api/applicants'

export function useApplicants() {
  return useQuery({
    queryKey: ['applicants'],
    queryFn: () => applicantsApi.getAll(),
  })
}