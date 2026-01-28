import { useQuery } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications'

export function useApplication(id: string | null) {
  return useQuery({
    queryKey: ['application', id],
    queryFn: () => applicationsApi.getOne(id!),
    enabled: !!id,
  })
}