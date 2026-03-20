import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users'

export function useRotateApiKey() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => usersApi.rotateApiKey(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
