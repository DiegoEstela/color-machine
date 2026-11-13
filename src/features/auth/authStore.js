import { create } from 'zustand'
import { supabase } from '../storage/supabase.js'
import { onAuthChange } from './authService.js'

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
