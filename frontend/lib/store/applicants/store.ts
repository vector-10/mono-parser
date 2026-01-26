import { create } from 'zustand'
import { ApplicantsState } from './types'

export const useApplicantsStore = create<ApplicantsState>((set) => ({
  selectedApplicantId: null,
  isCreateModalOpen: false,

  actions: {
    setSelectedApplicant: (id) => set({ selectedApplicantId: id }),
    openCreateModal: () => set({ isCreateModalOpen: true }),
    closeCreateModal: () => set({ isCreateModalOpen: false }),
  },
}))