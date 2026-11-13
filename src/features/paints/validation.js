import { normalizeHex } from '../../lib/color.js'

export const NAME_MAX = 40

/** Valida una pintura. Devuelve `{ errors, values }`; `values` solo si no hay errores. */
export function validatePaint({ name, hex }) {
  const errors = {}
  const trimmed = (name ?? '').trim()
  if (trimmed.length === 0) errors.name = 'Ponele un nombre a la pintura.'
  else if (trimmed.length > NAME_MAX) errors.name = `El nombre puede tener hasta ${NAME_MAX} caracteres.`
  const normalized = normalizeHex(hex ?? '')
  if (!normalized) errors.hex = 'Usá un hex válido, por ejemplo #e63946.'
  return Object.keys(errors).length > 0
    ? { errors, values: null }
    : { errors, values: { name: trimmed, hex: normalized } }
}
