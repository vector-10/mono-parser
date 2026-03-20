import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications'

export function useApplications(status?: string) {
  return useQuery({
    queryKey: ['applications', status ?? 'all'],
    queryFn: () => applicationsApi.getAll(status),
    staleTime: 30_000,
  })
}
