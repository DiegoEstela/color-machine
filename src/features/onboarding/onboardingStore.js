import { create } from 'zustand'
import { hasSeen, markSeen } from './onboardingStorage.js'

const initial = { open: false, mode: 'tour', screen: null, index: 0, userId: null, autoDone: false }

/**
 * Estado del onboarding. `mode`: 'tour' (recorrido completo, tarjeta `index`) o 'context' (ayuda de la pantalla `screen`).
 * El recorrido se marca como visto al cerrarlo de cualquier forma (terminar, omitir, Atrás). La ayuda por pantalla no.
 */
export const useOnboardingStore = create((set, get) => ({
  ...initial,

  /** Primera vez que entra con sesión: abre el recorrido si ese usuario todavía no lo vio. Una sola vez por sesión. */
  autoStart(userId) {
    if (get().autoDone || !userId) return
    set({ autoDone: true, userId })
    if (!hasSeen(userId)) set({ open: true, mode: 'tour', index: 0 })
  },

  /** Abre el recorrido completo desde el principio ("Ver el recorrido de nuevo"). */
  startTour: () => set({ open: true, mode: 'tour', index: 0 }),

  /** Abre la ayuda de la pantalla actual. */
  startContext: (screen) => set({ open: true, mode: 'context', screen, index: 0 }),

  /** Desde la ayuda de una pantalla, pasa al recorrido completo. */
  showTour: () => set({ mode: 'tour', index: 0 }),

  goTo: (index, total) => set({ index: Math.max(0, Math.min(total - 1, index)) }),

  close() {
    const { mode, userId, open } = get()
    if (!open) return
    if (mode === 'tour') markSeen(userId)
    set({ open: false })
  },

  /** Al cerrar sesión: el próximo usuario que entre tiene que poder verlo. */
  reset: () => set({ ...initial }),
}))
