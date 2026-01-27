import { useMutation } from '@tanstack/react-query'
import { applicationsApi } from '@/lib/api/applications'

export function useStartAnalysis() {
  return useMutation({
    mutationFn: ({ applicationId, clientId }: { applicationId: string; clientId?: string }) => 
      applicationsApi.startAnalysis(applicationId, clientId),
  })
}