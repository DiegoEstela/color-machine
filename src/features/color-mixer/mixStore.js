import { create } from 'zustand'
import { normalizeHex } from '../../lib/color.js'
import { DEFAULT_MAX_PARTS } from './solver.js'
import { rankOf } from './solver.js'
import { solveAsync, suggestAsync } from './solverClient.js'
import { NEEDS_HELP_DELTA_E } from './advisor.js'
import { NEUTRAL_TWEAK, clampTweak, isNeutral, shiftTarget } from './tweak.js'

export const TOTAL_STEPS = 3

/** Identifica un cálculo: si cambia el objetivo, las pinturas o la precisión, el resultado anterior deja de valer. */
export const resultKey = (target, paints, maxParts, tweak) => {
  const base = [target, maxParts, paints.map((p) => [p.id, p.hex])]
  return JSON.stringify(isNeutral(tweak) ? base : [...base, clampTweak(tweak)]) // sin ajuste, la clave es la de siempre
}

export const useMixStore = create((set, get) => ({
  step: 1,
  targetColor: null,
  targetThumb: null, // miniatura del recorte, solo en memoria
  maxParts: DEFAULT_MAX_PARTS,
  recipeKey: 'recommended', // 'recommended' | 'best'
  tweak: { ...NEUTRAL_TWEAK }, // ajuste de Luz e Intensidad (-3..+3) pedido en el panel "Ajustar"
  extraPaints: [], // pinturas estándar sumadas a esta mezcla desde el paso 3 (solo en memoria)
  result: null, // { key, status: 'mixing' | 'ready' | 'error', data, suggestions }
  savedRecipes: {}, // firma de receta (objetivo + partes) → id guardado, para no duplicar en la sesión

  /** Guarda el color objetivo (hex normalizado). Ignora valores inválidos. */
  setTarget(hex) {
    const color = normalizeHex(hex)
    if (!color) return
    // otro color objetivo = otra mezcla: las pinturas sumadas y el ajuste de la anterior ya no corresponden
    set(color === get().targetColor ? {} : { targetColor: color, extraPaints: [], tweak: { ...NEUTRAL_TWEAK } })
  },

  setTargetThumb: (thumb) => set({ targetThumb: thumb ?? null }),

  setMaxParts: (maxParts) => set({ maxParts }),

  /** Ajuste de Luz e Intensidad: `{ light, vivid }`, cada uno de -3 a +3 (se recorta). */
  setTweak: (tweak) => set({ tweak: clampTweak(tweak) }),

  resetTweak: () => set({ tweak: { ...NEUTRAL_TWEAK } }),

  /** Suma una pintura estándar a esta mezcla (por ejemplo "+ Blanco"). Ignora la que ya está sumada. */
  addExtra(paint) {
    if (get().extraPaints.some((p) => p.id === paint.id)) return
    set((s) => ({ extraPaints: [...s.extraPaints, { ...paint, standard: true }] }))
  },

  removeExtra: (id) => set((s) => ({ extraPaints: s.extraPaints.filter((p) => p.id !== id) })),

  /** Recuerda que esta receta ya se guardó (clave = `recipeSignature`). */
  markSaved: (signature, id) => set((s) => ({ savedRecipes: { ...s.savedRecipes, [signature]: id } })),

  /** "Mezclar este color otra vez": usa el color de una receta como objetivo y va a elegir pinturas (paso 2). */
  remix(hex) {
    const color = normalizeHex(hex)
    if (!color) return
    set({ targetColor: color, targetThumb: null, step: 2, result: null, recipeKey: 'recommended', extraPaints: [], tweak: { ...NEUTRAL_TWEAK } })
  },

  selectRecipe: (recipeKey) => set({ recipeKey }),

  /**
   * Calcula las recetas. Si ya hay un resultado para los mismos datos no recalcula;
   * si llega una respuesta vieja (los datos cambiaron mientras tanto) se descarta.
   */
  async calculate({ target, paints }) {
    const { maxParts, tweak } = get()
    const key = resultKey(target, paints, maxParts, tweak)
    const aim = isNeutral(tweak) ? null : shiftTarget(target, tweak) // color al que apunta el cálculo con "más luz" o "más intenso"
    if (get().result?.key === key) return
    set({ result: { key, status: 'mixing', data: null, suggestions: [] }, recipeKey: 'recommended' })
    try {
      const data = await solveAsync(aim ? { target, paints, maxParts, aim } : { target, paints, maxParts })
      if (get().result?.key !== key) return
      set({ result: { key, status: 'ready', data, suggestions: [] } })
      if (data && rankOf(data.best) >= NEEDS_HELP_DELTA_E) {
        const suggestions = await suggestAsync(aim ?? target, paints, maxParts)
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

  reset: () => set({ step: 1, targetColor: null, targetThumb: null, maxParts: DEFAULT_MAX_PARTS, recipeKey: 'recommended', result: null, savedRecipes: {}, extraPaints: [], tweak: { ...NEUTRAL_TWEAK } }),
}))
