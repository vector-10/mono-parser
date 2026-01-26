export interface ApplicantsState {
  selectedApplicantId: string | null
  isCreateModalOpen: boolean
  actions: {
    setSelectedApplicant: (id: string | null) => void
    openCreateModal: () => void
    closeCreateModal: () => void
  }
}