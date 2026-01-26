export interface ApplicationsState {
  selectedApplicationId: string | null
  isCreateModalOpen: boolean
  actions: {
    setSelectedApplication: (id: string | null) => void
    openCreateModal: () => void
    closeCreateModal: () => void
  }
}