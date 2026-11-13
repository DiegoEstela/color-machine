import { create } from 'zustand'
import { supabase } from '../storage/supabase.js'
import { onAuthChange } from './authService.js'
import { usePaintsStore } from '../paints/paintsStore.js'
import { useMixStore } from '../color-mixer/mixStore.js'
import { useRecipesStore } from '../recipes/recipesStore.js'

/** status: 'loading' | 'signedIn' | 'signedOut' | 'unconfigured' */
export const useAuthStore = create((set, get) => ({
  user: null,
  status: 'loading',
  recovering: false,

  /** Empieza a escuchar la sesión. Devuelve la función para dejar de escuchar. */
  init() {
    if (!supabase) {
      set({ status: 'unconfigured', user: null })
      return () => {}
    }
    return onAuthChange((event, session) => {
      // Al cerrar sesión no deben quedar datos del usuario anterior en memoria.
      if (event === 'SIGNED_OUT') {
        usePaintsStore.getState().reset()
        useRecipesStore.getState().reset()
        useMixStore.getState().reset()
      }
      set({
        user: session?.user ?? null,
        status: session ? 'signedIn' : 'signedOut',
        recovering:
          event === 'PASSWORD_RECOVERY' ? true : event === 'SIGNED_OUT' ? false : get().recovering,
      })
    })
  },

  finishRecovery: () => set({ recovering: false }),
}))
