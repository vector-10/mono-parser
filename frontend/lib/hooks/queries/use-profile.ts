import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/lib/api/auth'

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    retry: false,
  })
}