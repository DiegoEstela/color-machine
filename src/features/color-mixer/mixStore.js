import { create } from 'zustand'
import { normalizeHex } from '../../lib/color.js'

export const TOTAL_STEPS = 3

export const useMixStore = create((set, get) => ({
  step: 1,
  targetColor: null,
  targetThumb: null, // miniatura del recorte, solo en memoria

  /** Guarda el color objetivo (hex normalizado). Ignora valores inválidos. */
  setTarget(hex) {
    const color = normalizeHex(hex)
    if (color) set({ targetColor: color })
  },

  setTargetThumb: (thumb) => set({ targetThumb: thumb ?? null }),

  /** Avanza solo si ya hay color objetivo. */
  next() {
    const { step, targetColor } = get()
    if (step === 1 && !targetColor) return
    set({ step: Math.min(TOTAL_STEPS, step + 1) })
  },

  back: () => set((s) => ({ step: Math.max(1, s.step - 1) })),

  reset: () => set({ step: 1, targetColor: null, targetThumb: null }),
}))
