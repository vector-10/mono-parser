import { create } from 'zustand'
import { ApplicationsState } from './types'

export const useApplicationsStore = create<ApplicationsState>((set) => ({
  selectedApplicationId: null,
  isCreateModalOpen: false,

  actions: {
    setSelectedApplication: (id) => set({ selectedApplicationId: id }),
    openCreateModal: () => set({ isCreateModalOpen: true }),
    closeCreateModal: () => set({ isCreateModalOpen: false }),
  },
}))