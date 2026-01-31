import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users'
import { useAuthStore } from '@/lib/store/auth'

export function useUpdateApiKey() {
  const queryClient = useQueryClient()
  const { actions } = useAuthStore()

  return useMutation({
    mutationFn: ({ monoApiKey }: { monoApiKey: string; }) => 
      usersApi.updateApiKey(monoApiKey),
    onSuccess: (data) => {
      actions.setAuth(data, useAuthStore.getState().token!)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}