import { create } from 'zustand'
import { normalizeHex } from '../../lib/color.js'
import { DEFAULT_MAX_PARTS } from './solver.js'
import { solveAsync, suggestAsync } from './solverClient.js'
import { NEEDS_HELP_DELTA_E } from './advisor.js'

export const TOTAL_STEPS = 3

/** Identifica un cálculo: si cambia el objetivo, las pinturas o la precisión, el resultado anterior deja de valer. */
export const resultKey = (target, paints, maxParts) =>
  JSON.stringify([target, maxParts, paints.map((p) => [p.id, p.hex])])

export const useMixStore = create((set, get) => ({
  step: 1,
  targetColor: null,
  targetThumb: null, // miniatura del recorte, solo en memoria
  maxParts: DEFAULT_MAX_PARTS,
  recipeKey: 'recommended', // 'recommended' | 'best' | 'others'
  result: null, // { key, status: 'mixing' | 'ready' | 'error', data, suggestions }

  /** Guarda el color objetivo (hex normalizado). Ignora valores inválidos. */
  setTarget(hex) {
    const color = normalizeHex(hex)
    if (color) set({ targetColor: color })
  },

  setTargetThumb: (thumb) => set({ targetThumb: thumb ?? null }),

  setMaxParts: (maxParts) => set({ maxParts }),

  selectRecipe: (recipeKey) => set({ recipeKey }),

  /**
   * Calcula las recetas. Si ya hay un resultado para los mismos datos no recalcula;
   * si llega una respuesta vieja (los datos cambiaron mientras tanto) se descarta.
   */
  async calculate({ target, paints }) {
    const { maxParts } = get()
    const key = resultKey(target, paints, maxParts)
    if (get().result?.key === key) return
    set({ result: { key, status: 'mixing', data: null, suggestions: [] }, recipeKey: 'recommended' })
    try {
      const data = await solveAsync({ target, paints, maxParts })
      if (get().result?.key !== key) return
      set({ result: { key, status: 'ready', data, suggestions: [] } })
      if (data && data.best.deltaE >= NEEDS_HELP_DELTA_E) {
        const suggestions = await suggestAsync(target, paints, maxParts)
        if (get().result?.key === key) set({ result: { ...get().result, suggestions } })
      }
    } catch {
      if (get().result?.key === key) set({ result: { key, status: 'error', data: null, suggestions: [] } })
    }
  },

  /** Avanza solo si ya hay color objetivo. */
  next() {
    const { step, targetColor } = get()
    if (step === 1 && !targetColor) return
    set({ step: Math.min(TOTAL_STEPS, step + 1) })
  },

  back: () => set((s) => ({ step: Math.max(1, s.step - 1) })),

  reset: () => set({ step: 1, targetColor: null, targetThumb: null, maxParts: DEFAULT_MAX_PARTS, recipeKey: 'recommended', result: null }),
}))
