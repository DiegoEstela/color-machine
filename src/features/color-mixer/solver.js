import { deltaE, mixHex } from './mixer.js'

export const PRECISION = { simple: 6, normal: 10, preciso: 16 }
export const DEFAULT_MAX_PARTS = PRECISION.normal
export const DEFAULT_MAX_PAINTS = 4 // en la práctica no se mezclan más de 4 pinturas a la vez
const RECOMMENDED_TOLERANCE = 1 // ΔE extra que se acepta a cambio de una receta más simple
const ALTERNATIVE_WINDOW = 3 // las alternativas no pueden ser peores que la mejor por más de esto

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))

/**
 * Todas las composiciones de partes enteras para `count` pinturas con 1..maxParts partes en total,
 * como máximo `maxPaints` pinturas distintas y solo las primitivas (se descartan 2:2, 4:2, etc.).
 * El orden es determinista.
 */
export function enumerateRecipes(count, maxParts, maxPaints = DEFAULT_MAX_PAINTS) {
  const out = []
  const current = new Array(count).fill(0)
  const walk = (i, left, used) => {
    if (i === count) {
      const total = maxParts - left
      if (total === 0) return
      if (current.reduce((g, v) => gcd(g, v), 0) === 1) out.push(current.slice())
      return
    }
    current[i] = 0
    walk(i + 1, left, used)
    if (used < maxPaints) {
      for (let p = 1; p <= left; p++) {
        current[i] = p
        walk(i + 1, left - p, used + 1)
      }
      current[i] = 0
    }
  }
  walk(0, maxParts, 0)
  return out
}

/** Calidad del parecido en palabras, según ΔE 2000. */
export function describeQuality(dE) {
  if (dE < 2) return 'Casi idéntico'
  if (dE < 5) return 'Muy parecido'
  if (dE < 10) return 'Parecido'
  return 'Aproximado'
}

/** Nivel del medidor de parecido: 4 = casi idéntico ... 1 = aproximado. */
export function qualityLevel(dE) {
  if (dE < 2) return 4
  if (dE < 5) return 3
  if (dE < 10) return 2
  return 1
}

const buildRecipe = (paints, amounts, target, aim) => {
  const parts = paints
    .map((p, i) => ({ paintId: p.id, name: p.name, hex: p.hex, parts: amounts[i] }))
    .filter((p) => p.parts > 0)
  const mixed = mixHex(parts)
  const dE = deltaE(target, mixed)
  const recipe = { parts, total: parts.reduce((s, p) => s + p.parts, 0), mixHex: mixed, deltaE: dE, quality: describeQuality(dE) }
  // Con `aim`, además se guarda la distancia al color al que se apunta (que decide el orden); `deltaE` sigue siendo contra el real.
  if (aim) recipe.aimDeltaE = deltaE(aim, mixed)
  return recipe
}

/** Distancia que ordena las recetas: al color al que se apunta (`aim`) si lo hay, y si no, al color objetivo. */
export const rankOf = (recipe) => recipe.aimDeltaE ?? recipe.deltaE

const byQuality = (a, b) => rankOf(a) - rankOf(b) || a.total - b.total || a.mixHex.localeCompare(b.mixHex)

/**
 * Busca las mejores recetas de partes enteras para acercarse a `target` con `paints` ([{ id, name, hex }]).
 * Devuelve `{ recommended, best, alternatives }` (null si no hay pinturas):
 * - best: menor ΔE.
 * - `aim` (opcional): color al que apunta el cálculo (por ejemplo, el objetivo corrido para "más luz"). Ordena y elige
 *   las recetas, pero `deltaE` y `quality` se siguen midiendo contra `target`; `aimDeltaE` es la distancia a `aim`.
 * - recommended: la de menos partes cuyo ΔE no supera el mejor en más de 1.
 * - alternatives: hasta 2 recetas distintas a simple vista, casi tan buenas.
 */
export function solve({ target, paints, maxParts = DEFAULT_MAX_PARTS, maxPaints = DEFAULT_MAX_PAINTS, aim }) {
  if (!paints || paints.length === 0) return null
  const recipes = enumerateRecipes(paints.length, maxParts, maxPaints)
    .map((amounts) => buildRecipe(paints, amounts, target, aim))
    .sort(byQuality)

  const best = recipes[0]
  const recommended = recipes
    .filter((r) => rankOf(r) <= rankOf(best) + RECOMMENDED_TOLERANCE)
    .reduce((a, b) => (b.total < a.total || (b.total === a.total && rankOf(b) < rankOf(a)) ? b : a))

  const picked = [best, recommended]
  const alternatives = []
  for (const r of recipes) {
    if (alternatives.length === 2) break
    if (rankOf(r) > rankOf(best) + ALTERNATIVE_WINDOW) break
    if (picked.some((p) => p === r || deltaE(p.mixHex, r.mixHex) < 1)) continue
    picked.push(r)
    alternatives.push(r)
  }
  return { recommended, best, alternatives }
}
