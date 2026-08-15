import { create } from 'zustand'

export const useAppStore = create((set) => ({
  // Navbar Visibility State
  isNavbarVisible: true,
  toggleNavbar: () => set((state) => ({ isNavbarVisible: !state.isNavbarVisible })),

  // Organization State (Can be fetched from SQLite later)
  activeOrganization: 'Devraj Store',
  setActiveOrganization: (name) => set({ activeOrganization: name })
}))
