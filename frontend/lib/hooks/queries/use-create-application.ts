import { useMutation, useQueryClient } from '@tanstack/react-query'
import { applicationsApi, CreateApplicationData } from '@/lib/api/applications'
import { applicantsApi, CreateApplicantData } from '@/lib/api/applicants'

interface CreateApplicationWithApplicantData {
  applicant: CreateApplicantData
  loan: Omit<CreateApplicationData, 'applicantId'>
}

export function useCreateApplication() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateApplicationWithApplicantData) => {
      // Step 1: Create applicant
      const applicant = await applicantsApi.create(data.applicant)

      // Step 2: Create application with applicantId
      const application = await applicationsApi.create({
        applicantId: applicant.id,
        ...data.loan,
      })

      return { applicant, application }
    },
    onSuccess: () => {
      // Invalidate applications list to refetch
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })
}