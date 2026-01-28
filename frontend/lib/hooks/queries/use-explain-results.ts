import { useQuery } from '@tanstack/react-query'
import { geminiApi } from '@/lib/api/gemini'

export function useExplainResults(applicationId: string | null, enabled: boolean = false) {
  return useQuery({
    queryKey: ['explain-results', applicationId],
    queryFn: () => geminiApi.explainResults(applicationId!),
    enabled: enabled && !!applicationId,
    retry: 1,
  })
}