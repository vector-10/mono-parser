import { useMutation } from '@tanstack/react-query'
import { monoApi } from '@/lib/api/mono'

export function useExchangeMonoToken() {
  return useMutation({
    mutationFn: ({ code, applicantId }: { code: string; applicantId: string }) => 
      monoApi.exchangeToken(code, applicantId),
  })
}