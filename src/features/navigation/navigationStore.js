import { create } from 'zustand'

/** Estado de la navegación que no es una ruta: por ahora, si el menú lateral (drawer) está abierto. */
export const useNavigationStore = create((set) => ({
  drawerOpen: false,
  openDrawer: () => set({ drawerOpen: true }),
  closeDrawer: () => set({ drawerOpen: false }),
}))
