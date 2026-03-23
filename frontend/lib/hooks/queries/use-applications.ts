import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications'

export function useApplications(status?: string, search?: string) {
  return useQuery({
    queryKey: ['applications', status ?? 'all', search ?? ''],
    queryFn: () => applicationsApi.getAll(status, search || undefined),
    staleTime: 30_000,
  })
}
