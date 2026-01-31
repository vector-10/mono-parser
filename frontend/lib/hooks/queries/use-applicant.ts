import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { applicantsApi, CreateApplicantData } from '@/lib/api/applicants'
import { toast } from 'sonner'

export function useApplicant(id: string | null) {
  return useQuery({
    queryKey: ['applicant', id],
    queryFn: () => applicantsApi.getOne(id!),
    enabled: !!id,
  })
}

export function useUpdateApplicant() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateApplicantData> }) =>
      applicantsApi.update(id, data),
    onSuccess: (updatedApplicant) => {
      queryClient.invalidateQueries({ queryKey: ['applicant', updatedApplicant.id] })
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      toast.success('Applicant updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update applicant')
    },
  })
}

export function useDeleteApplicant() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => applicantsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicants'] })
      toast.success('Applicant deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete applicant')
    },
  })
}