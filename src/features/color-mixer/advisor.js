import { converter } from 'culori'
import { deltaE } from './mixer.js'
import { BASE_PAINTS } from './referencePaints.js'
import { describeQuality, solve } from './solver.js'

const toLab = converter('lab')
const ADVICE_MAX_PARTS = 8
const SUGGEST_MAX_PARTS = 8
const SUGGEST_MAX_PAINTS = 3
export const HAVE_THRESHOLD = 30 // ΔE máximo para decir que una pintura del usuario "es" una pintura base
export const NEEDS_HELP_DELTA_E = 5 // desde acá se considera que las pinturas no alcanzan
export const MIN_IMPROVEMENT = 3 // una sugerencia debe acercar al menos esto (ΔE) o subir de categoría de calidad

/**
 * Pinturas base que conviene tener para lograr `target`: las que usa la receta recomendada
 * resolviendo el problema con la caja de referencia. Devuelve `{ roles, recipe }`.
 */
export function adviseBasePaints(target) {
  const { recommended } = solve({ target, paints: BASE_PAINTS, maxParts: ADVICE_MAX_PARTS, maxPaints: 3 })
  const used = new Set(recommended.parts.map((p) => p.paintId))
  return { roles: BASE_PAINTS.filter((b) => used.has(b.id)), recipe: recommended }
}

/**
 * Cruza el consejo con las pinturas del usuario. Cada pintura "pertenece" a la pintura base más cercana
 * (si está a menos de HAVE_THRESHOLD) y solo cubre esa: nunca dos bases. Si varias compiten, gana la más cercana.
 * Devuelve `[{ role, status: 'have' | 'missing', paint? }]` en el orden de `roles`.
 */
export function matchPaints(roles, userPaints) {
  const claims = userPaints
    .map((paint) => {
      const nearest = BASE_PAINTS.map((role) => ({ role, dE: deltaE(paint.hex, role.hex) })).sort((a, b) => a.dE - b.dE)[0]
      return { paint, role: nearest.role, dE: nearest.dE }
    })
    .filter((c) => c.dE <= HAVE_THRESHOLD)
    .sort((a, b) => a.dE - b.dE)

  const owner = new Map()
  for (const c of claims) if (!owner.has(c.role.id)) owner.set(c.role.id, c.paint)
  return roles.map((role) =>
    owner.has(role.id) ? { role, status: 'have', paint: owner.get(role.id) } : { role, status: 'missing' },
  )
}

/**
 * Si con `selectedPaints` el mejor ΔE es >= 5, prueba sumar de a una las pinturas base que faltan y devuelve
 * las que acercan el resultado (mejora >= MIN_IMPROVEMENT de ΔE, o que suben la calidad en palabras), de mayor a menor mejora:
 * `[{ role, deltaE, improvement }]`. Lista vacía si ya alcanza. `maxParts` es la precisión del cálculo.
 */
export function suggestAdditions(target, selectedPaints, { maxParts = SUGGEST_MAX_PARTS } = {}) {
  const options = { target, maxParts, maxPaints: SUGGEST_MAX_PAINTS }
  const current = solve({ ...options, paints: selectedPaints })
  if (!current || current.best.deltaE < NEEDS_HELP_DELTA_E) return []

  return matchPaints(BASE_PAINTS, selectedPaints)
    .filter((m) => m.status === 'missing')
    .map(({ role }) => {
      const withRole = solve({ ...options, paints: [...selectedPaints, role] })
      return { role, deltaE: withRole.best.deltaE, improvement: current.best.deltaE - withRole.best.deltaE }
    })
    .filter((s) => s.improvement >= MIN_IMPROVEMENT || (s.improvement > 0 && describeQuality(s.deltaE) !== describeQuality(current.best.deltaE)))
    .sort((a, b) => b.improvement - a.improvement || a.role.id.localeCompare(b.role.id))
}

/**
 * Explica por qué una receta queda lejos (solo si ΔE >= 5). Umbrales: diferencia de claridad Lab > 8,
 * diferencia de intensidad (croma) > 12. Devuelve `[{ code, message }]`.
 */
export function diagnose(target, recipe) {
  if (recipe.deltaE < NEEDS_HELP_DELTA_E) return []
  const t = toLab(target)
  const m = toLab(recipe.mixHex)
  const out = []
  const dL = t.l - m.l
  if (dL > 8) out.push({ code: 'need_white', message: 'Tu color es más claro: probá sumar blanco.' })
  else if (dL < -8) out.push({ code: 'need_black', message: 'Tu color es más oscuro: probá sumar negro.' })
  if (Math.hypot(t.a, t.b) - Math.hypot(m.a, m.b) > 12) {
    out.push({
      code: 'need_vivid',
      message: 'Tu color es más intenso que lo que logran estas pinturas: probá con pinturas más puras.',
    })
  }
  if (out.length === 0) out.push({ code: 'need_hue', message: 'Falta una pintura de un tono parecido al tuyo.' })
  return out
}
