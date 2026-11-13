import { normalizeHex } from '../../lib/color.js'
import { deltaE, mixHex } from '../color-mixer/mixer.js'
import { describeQuality } from '../color-mixer/solver.js'
import { BASE_PAINTS } from '../color-mixer/referencePaints.js'
import { MIX_MAX, RECIPE_NAME_MAX } from './validation.js'

export const EDITOR_MAX_PAINTS = 6 // pinturas distintas en el editor (la base admite hasta 12)
export const EDITOR_MAX_PARTS = 20 // partes por pintura
export const HISTORY_MAX = 30 // cuántos cambios se pueden deshacer
const SAME_DELTA_E = 0.3 // por debajo de esta diferencia se dice que quedó "igual"

const WHITE = BASE_PAINTS.find((p) => p.id === 'base-blanco')
const BLACK = BASE_PAINTS.find((p) => p.id === 'base-negro')

const clampParts = (n) => Math.max(1, Math.min(EDITOR_MAX_PARTS, n))
const sameColor = (a, b) => a.hex.toLowerCase() === b.hex.toLowerCase() && a.name === b.name

/** Copia la mezcla guardada (`[{ name, hex, parts }]`) a un borrador editable. */
export const createDraft = (mix) => mix.map((m) => ({ name: m.name, hex: m.hex.toLowerCase(), parts: m.parts }))

/** Suma (o resta, con `delta` negativo) partes a la pintura `index`: entre 1 y 20. Ignora un índice inexistente. */
export function bumpParts(draft, index, delta) {
  if (!draft[index]) return draft
  const parts = clampParts(draft[index].parts + delta)
  return parts === draft[index].parts ? draft : draft.map((p, i) => (i === index ? { ...p, parts } : p))
}

/** Quita una pintura; siempre queda al menos una. */
export const removePaint = (draft, index) => (draft.length <= 1 || !draft[index] ? draft : draft.filter((_, i) => i !== index))

/** ¿Se puede sumar esta pintura? Sí si ya está (suma una parte) o si todavía entran más pinturas distintas. */
export const canAddPaint = (draft, paint) => draft.some((p) => sameColor(p, paint)) || draft.length < EDITOR_MAX_PAINTS

/** Suma `parts` de una pintura (`{ name, hex }`). Si ya está en la receta, le suma partes; si no entra, no cambia nada. */
export function addPaint(draft, paint, parts = 1) {
  const i = draft.findIndex((p) => sameColor(p, paint))
  if (i >= 0) return bumpParts(draft, i, parts)
  if (draft.length >= EDITOR_MAX_PAINTS) return draft
  return [...draft, { name: paint.name, hex: paint.hex.toLowerCase(), parts: clampParts(parts) }]
}

/** Atajos: "Más claro" suma 1 parte de Blanco estándar y "Más oscuro" 1 de Negro estándar. */
export const lighten = (draft) => addPaint(draft, WHITE)
export const darken = (draft) => addPaint(draft, BLACK)

/** Color de la mezcla del borrador (spectral.js). */
export const draftResult = (draft) => mixHex(draft.map((p) => ({ hex: p.hex, parts: p.parts })))

/**
 * Compara contra lo guardado, midiendo siempre contra el color buscado original:
 * `{ before, after, trend }` con ΔE 2000 y `trend` = 'better' | 'same' | 'worse'.
 */
export function compareToSaved({ target, savedResult, draftResult: now }) {
  const before = deltaE(target, savedResult)
  const after = deltaE(target, now)
  const diff = before - after
  return {
    before,
    after,
    beforeQuality: describeQuality(before),
    afterQuality: describeQuality(after),
    trend: Math.abs(diff) < SAME_DELTA_E ? 'same' : diff > 0 ? 'better' : 'worse',
  }
}

const signature = (mix) => JSON.stringify(mix.map((p) => [p.name, p.hex.toLowerCase(), p.parts]))
/** ¿El borrador es distinto de lo guardado? */
export const isDirty = (saved, draft) => signature(saved) !== signature(draft)

/** Lo que se guarda al editar: `{ payload: { mix, result_hex } }` o `{ error }`. El color buscado no cambia. */
export function buildEditPayload(draft) {
  const mix = draft.map((p) => ({ name: String(p.name).trim(), hex: normalizeHex(p.hex), parts: p.parts }))
  const valid = mix.length >= 1 && mix.length <= MIX_MAX && mix.every((m) => m.name && m.hex && Number.isInteger(m.parts) && m.parts >= 1)
  if (!valid) return { error: 'Esta receta no se puede guardar.' }
  return { payload: { mix, result_hex: draftResult(mix) } }
}

/** Nombre sugerido para una copia: "<nombre> (editada)", recortado al máximo de la base. */
export function copyName(name) {
  const suffix = ' (editada)'
  const base = String(name ?? '').trim().slice(0, RECIPE_NAME_MAX - suffix.length).trimEnd()
  return `${base}${suffix}`
}

/** Estado inicial del editor: lo guardado, el borrador y la pila para deshacer. */
export const initEditor = (mix) => ({ saved: createDraft(mix), draft: createDraft(mix), history: [] })

const push = (state, draft) =>
  draft === state.draft ? state : { ...state, draft, history: [...state.history, state.draft].slice(-HISTORY_MAX) }

/**
 * Reductor del editor. Acciones: `bump {index, delta}`, `remove {index}`, `add {paint, parts?}`, `lighten`, `darken`,
 * `undo`, `reset` (vuelve a lo guardado) y `saved` (lo guardado pasa a ser el borrador actual).
 */
export function editorReducer(state, action) {
  switch (action.type) {
    case 'bump': return push(state, bumpParts(state.draft, action.index, action.delta))
    case 'remove': return push(state, removePaint(state.draft, action.index))
    case 'add': return push(state, addPaint(state.draft, action.paint, action.parts ?? 1))
    case 'lighten': return push(state, lighten(state.draft))
    case 'darken': return push(state, darken(state.draft))
    case 'undo': {
      if (state.history.length === 0) return state
      return { ...state, draft: state.history[state.history.length - 1], history: state.history.slice(0, -1) }
    }
    case 'reset': return isDirty(state.saved, state.draft) ? push(state, state.saved) : state
    case 'saved': return { saved: state.draft, draft: state.draft, history: [] }
    default: return state
  }
}
