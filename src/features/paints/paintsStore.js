import { create } from 'zustand'
import { paintsRepo } from '../storage/paintsRepo.js'

export const MIN_SELECTED = 2
export const MAX_SELECTED = 6

const initial = { paints: [], selectedIds: [], thumbs: {}, status: 'idle', error: null }

/** status: 'idle' | 'loading' | 'ready' | 'error'. Las miniaturas (`thumbs`) viven solo en memoria. */
export const usePaintsStore = create((set, get) => ({
  ...initial,

  async load() {
    set({ status: 'loading', error: null })
    const { data, error } = await paintsRepo.list()
    if (error) return set({ status: 'error', error: error.message })
    const ids = new Set(data.map((p) => p.id))
    set((s) => ({ status: 'ready', paints: data, selectedIds: s.selectedIds.filter((id) => ids.has(id)) }))
  },

  /** `values` = { name, hex } ya validados. Devuelve `{ data }` o `{ error }`. */
  async add({ name, hex }, thumb) {
    const { data, error } = await paintsRepo.create({ name, hex })
    if (error) return { error: error.message }
    set((s) => ({
      paints: [data, ...s.paints],
      thumbs: thumb ? { ...s.thumbs, [data.id]: thumb } : s.thumbs,
    }))
    return { data }
  },

  async update(id, { name, hex }) {
    const { data, error } = await paintsRepo.update(id, { name, hex })
    if (error) return { error: error.message }
    set((s) => {
      const { [id]: _old, ...thumbs } = s.thumbs // el color cambió: la miniatura ya no corresponde
      return { paints: s.paints.map((p) => (p.id === id ? data : p)), thumbs }
    })
    return { data }
  },

  async remove(id) {
    const { error } = await paintsRepo.remove(id)
    if (error) return { error: error.message }
    set((s) => {
      const { [id]: _old, ...thumbs } = s.thumbs
      return {
        paints: s.paints.filter((p) => p.id !== id),
        selectedIds: s.selectedIds.filter((x) => x !== id),
        thumbs,
      }
    })
    return {}
  },

  /** Marca o desmarca una pintura. Devuelve false si se alcanzó el máximo. */
  toggleSelect(id) {
    const { selectedIds } = get()
    if (selectedIds.includes(id)) {
      set({ selectedIds: selectedIds.filter((x) => x !== id) })
      return true
    }
    if (selectedIds.length >= MAX_SELECTED) return false
    set({ selectedIds: [...selectedIds, id] })
    return true
  },

  reset: () => set({ ...initial }),
}))
