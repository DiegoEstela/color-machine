import { normalizeHex } from '../../lib/color.js'

export const RECIPE_NAME_MAX = 60
export const MIX_MAX = 12

/** Valida el nombre de una receta (1 a 60 caracteres, como la base). Devuelve `{ error, value }`. */
export function validateRecipeName(name) {
  const value = (name ?? '').trim()
  if (value.length === 0) return { error: 'Ponele un nombre a la receta.', value }
  if (value.length > RECIPE_NAME_MAX) {
    return { error: `El nombre puede tener hasta ${RECIPE_NAME_MAX} caracteres.`, value }
  }
  return { error: null, value }
}

/**
 * Arma lo que se guarda en la tabla `recipes` a partir de la receta del solver:
 * `{ name, target_hex, result_hex, mix: [{ name, hex, parts }] }`. Devuelve `{ payload }` o `{ error }`.
 * `mix` es una copia (nombre, color y partes) para que la receta no cambie si después se edita una pintura.
 */
export function buildRecipePayload({ name, targetHex, recipe }) {
  const checked = validateRecipeName(name)
  if (checked.error) return { error: checked.error }
  const target = normalizeHex(targetHex)
  const result = normalizeHex(recipe?.mixHex)
  const parts = recipe?.parts ?? []
  const mix = parts.map((p) => ({ name: String(p.name).trim(), hex: normalizeHex(p.hex), parts: p.parts }))
  const valid =
    target && result && mix.length >= 1 && mix.length <= MIX_MAX &&
    mix.every((m) => m.name && m.hex && Number.isInteger(m.parts) && m.parts >= 1)
  if (!valid) return { error: 'Esta receta no se puede guardar.' }
  return { payload: { name: checked.value, target_hex: target, result_hex: result, mix } }
}

/** Resumen de partes para mostrar: "2 Rojo · 1 Azul". */
export const summarizeMix = (mix = []) => mix.map((m) => `${m.parts} ${m.name}`).join(' · ')

/** Total de partes de una receta guardada. */
export const totalParts = (mix = []) => mix.reduce((sum, m) => sum + m.parts, 0)

/** Identifica una receta (objetivo + partes) para saber si ya se guardó en esta sesión. */
export const recipeSignature = (targetHex, recipe) =>
  JSON.stringify([normalizeHex(targetHex), recipe.parts.map((p) => [p.paintId ?? p.name, p.hex, p.parts])])
