import { useQuery } from '@tanstack/react-query'
import { monoApi } from '@/lib/api/mono'

export function useMonoPublicKey() {
  return useQuery({
    queryKey: ['mono-public-key'],
    queryFn: () => monoApi.getPublicKey(),
    staleTime: Infinity, 
  })
}