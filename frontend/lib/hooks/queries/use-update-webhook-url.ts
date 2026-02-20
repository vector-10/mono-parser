import { useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/lib/api/users'

export function useUpdateWebhookUrl() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ webhookUrl }: { webhookUrl: string }) =>
      usersApi.updateWebhookUrl(webhookUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] })
    },
  })
}
