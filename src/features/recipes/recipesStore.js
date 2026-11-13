import { create } from 'zustand'
import { recipesRepo } from '../storage/recipesRepo.js'

const initial = { recipes: [], status: 'idle', error: null }

/** status: 'idle' | 'loading' | 'ready' | 'error'. Las recetas vienen de la más nueva a la más vieja. */
export const useRecipesStore = create((set) => ({
  ...initial,

  async load() {
    set({ status: 'loading', error: null })
    const { data, error } = await recipesRepo.list()
    if (error) return set({ status: 'error', error: error.message })
    set({ status: 'ready', recipes: data })
  },

  /** `payload` ya validado ({ name, target_hex, result_hex, mix }). Devuelve `{ data }` o `{ error }`. */
  async add(payload) {
    const { data, error } = await recipesRepo.create(payload)
    if (error) return { error: error.message }
    set((s) => ({ recipes: [data, ...s.recipes] }))
    return { data }
  },

  async rename(id, name) {
    const { data, error } = await recipesRepo.update(id, { name })
    if (error) return { error: error.message }
    set((s) => ({ recipes: s.recipes.map((r) => (r.id === id ? data : r)) }))
    return { data }
  },

  async remove(id) {
    const { error } = await recipesRepo.remove(id)
    if (error) return { error: error.message }
    set((s) => ({ recipes: s.recipes.filter((r) => r.id !== id) }))
    return {}
  },

  reset: () => set({ ...initial }),
}))
