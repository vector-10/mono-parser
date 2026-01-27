import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, CreateApplicationData } from '@/lib/api/applications'

export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateApplicationData) => applicationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}