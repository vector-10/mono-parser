import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications'

export function useApplications(status?: string) {
  return useQuery({
    queryKey: ['applications', status],
    queryFn: () => applicationsApi.getAll(status),
  })
}