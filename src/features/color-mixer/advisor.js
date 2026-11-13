import { converter } from 'culori'
import { deltaE } from './mixer.js'
import { BASE_PAINTS } from './referencePaints.js'
import { PRECISION, describeQuality, qualityLevel, solve } from './solver.js'

const toLab = converter('lab')
const ADVICE_MAX_PARTS = 8
const SUGGEST_MAX_PARTS = 8
const SUGGEST_MAX_PAINTS = 3
const PLAN_MAX_PARTS = 10 // tope de precisión del consejo completo: con 16 y 6 pinturas tardaba ~1,5 s (medido); con 10, ~0,2 s
const PLAN_MAX_PAINTS = 4
const PLAN_MAX_ADDED = 3 // cuántos colores faltantes se prueban sumar a la vez, como máximo
const PLAN_MIN_IMPROVEMENT = 0.5 // si nada mejora al menos esto (ΔE), no se recomienda sumar nada
const PLAN_MIN_IMPROVEMENT_FINE = 1 // con el umbral "para acercarte más" (ΔE ≥ 2) se pide una mejora de verdad
const PRECISION_MIN_IMPROVEMENT = 1 // una precisión mayor se recomienda si mejora al menos esto (ΔE) o sube de categoría
export const HAVE_THRESHOLD = 30 // ΔE máximo para decir que una pintura del usuario "es" una pintura base
export const NEEDS_HELP_DELTA_E = 5 // desde acá se considera que las pinturas no alcanzan
export const IMPROVE_DELTA_E = 2 // desde acá la pantalla ofrece "Para acercarte más" (por debajo es "Casi idéntico")
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

const combinations = (items, size) => {
  if (size === 0) return [[]]
  return items.flatMap((item, i) => combinations(items.slice(i + 1), size - 1).map((rest) => [item, ...rest]))
}

/**
 * Consejo completo: si con `selectedPaints` el mejor ΔE es >= 5, busca **todos** los colores base que faltan para llegar.
 * Prueba sumar 1, 2 y hasta 3 pinturas base que el usuario no tiene (todas juntas, no de a una) y elige el conjunto
 * **más chico que lleva el parecido a ΔE < 5**; si ninguno llega, el que más se acerca (si mejora de verdad).
 * Devuelve `null` si ya alcanza, o `{ roles, recipe, deltaE, quality, enough }`:
 * - `roles`: las pinturas base a sumar (vacío si sumar no mejora nada).
 * - `recipe`: la mejor receta con las pinturas elegidas + `roles` (`{ parts, total, mixHex, ... }`).
 * - `enough`: `true` si con eso queda por debajo de ΔE 5.
 */
export function planMissingPaints(target, selectedPaints, { maxParts = PLAN_MAX_PARTS, threshold = NEEDS_HELP_DELTA_E } = {}) {
  const options = { target, maxParts: Math.min(maxParts, PLAN_MAX_PARTS), maxPaints: PLAN_MAX_PAINTS }
  const current = solve({ ...options, paints: selectedPaints })
  if (!current || current.best.deltaE < threshold) return null

  // "Alcanza" = con el umbral de siempre (5), bajar de 5; con el umbral fino (< 5), subir de categoría de parecido.
  const fine = threshold < NEEDS_HELP_DELTA_E
  const startLevel = qualityLevel(current.best.deltaE)
  const reaches = (dE) => (fine ? qualityLevel(dE) > startLevel : dE < NEEDS_HELP_DELTA_E)
  const minImprovement = fine ? PLAN_MIN_IMPROVEMENT_FINE : PLAN_MIN_IMPROVEMENT

  const missing = matchPaints(BASE_PAINTS, selectedPaints).filter((m) => m.status === 'missing').map((m) => m.role)
  let best = null
  for (let size = 1; size <= Math.min(PLAN_MAX_ADDED, missing.length); size++) {
    let bestOfSize = null
    for (const roles of combinations(missing, size)) {
      const { best: recipe } = solve({ ...options, paints: [...selectedPaints, ...roles] })
      // solo cuentan las combinaciones donde de verdad se usan todos los colores sumados
      if (!roles.every((r) => recipe.parts.some((p) => p.paintId === r.id))) continue
      if (!bestOfSize || recipe.deltaE < bestOfSize.recipe.deltaE) bestOfSize = { roles, recipe }
    }
    if (!bestOfSize) continue
    if (!best || bestOfSize.recipe.deltaE < best.recipe.deltaE) best = bestOfSize
    if (reaches(bestOfSize.recipe.deltaE)) { best = bestOfSize; break } // el conjunto más chico que alcanza
  }

  if (!best || current.best.deltaE - best.recipe.deltaE < minImprovement) {
    return { roles: [], recipe: current.best, deltaE: current.best.deltaE, quality: current.best.quality, enough: false }
  }
  return { roles: best.roles, recipe: best.recipe, deltaE: best.recipe.deltaE, quality: best.recipe.quality, enough: reaches(best.recipe.deltaE) }
}

/**
 * ¿Una precisión mayor acerca la receta? Prueba las precisiones por encima de `maxParts` (6 → 10 → 16) y devuelve la primera
 * que mejora al menos 1 de ΔE o sube de categoría de parecido: `{ maxParts, deltaE, quality, recipe }`. `null` si no ayuda.
 */
export function suggestPrecision(target, paints, { maxParts = PRECISION.normal } = {}) {
  const current = solve({ target, paints, maxParts })
  if (!current) return null
  for (const next of Object.values(PRECISION).filter((n) => n > maxParts)) {
    const { best } = solve({ target, paints, maxParts: next })
    const gain = current.best.deltaE - best.deltaE
    if (gain >= PRECISION_MIN_IMPROVEMENT || (gain > 0 && qualityLevel(best.deltaE) > qualityLevel(current.best.deltaE))) {
      return { maxParts: next, deltaE: best.deltaE, quality: best.quality, recipe: best }
    }
  }
  return null
}

/** A qué pintura base se parece una pintura (`'base-rojo'`…), si está a menos de HAVE_THRESHOLD; si no, `null`. */
export function baseRoleOf(hex) {
  const nearest = BASE_PAINTS.map((role) => ({ role, dE: deltaE(hex, role.hex) })).sort((a, b) => a.dE - b.dE)[0]
  return nearest.dE <= HAVE_THRESHOLD ? nearest.role.id : null
}

// Cómo corregir cuando la mezcla "tira" a un tono: menos de una pintura o más de otra (por tipo de pintura base).
const TONE_FIX = {
  bluer: { less: ['base-azul'], more: ['base-amarillo'] },
  yellower: { less: ['base-amarillo'], more: ['base-azul'] },
  redder: { less: ['base-rojo'], more: ['base-azul', 'base-amarillo'] },
  greener: { less: ['base-azul', 'base-amarillo'], more: ['base-rojo'] },
}

/**
 * Qué cambiar sin agregar nada cuando la mezcla tira a un tono (`gap.tone` de `describeGap`). Usa los nombres de las pinturas
 * que ya están en la receta (`parts` = `[{ name, hex }]`) y solo nombra las que existen. Devuelve una frase o `null`.
 */
export function adviceForTone(gap, parts) {
  const fix = TONE_FIX[gap?.tone]
  if (!fix) return null
  // la primera pintura de la receta que sea de alguno de esos tipos, en el orden de preferencia de `TONE_FIX`
  const pick = (ids) => ids.map((id) => parts.find((p) => baseRoleOf(p.hex) === id)?.name).find(Boolean)
  const less = pick(fix.less)
  const more = pick(fix.more)
  const toward = { bluer: 'azul', yellower: 'amarillo', redder: 'rojo', greener: 'verde' }[gap.tone]
  if (less && more) return `Tira a ${toward}: probá menos ${less} o más ${more}.`
  if (less) return `Tira a ${toward}: probá menos ${less}.`
  if (more) return `Tira a ${toward}: probá más ${more}.`
  return null
}

const toLch = converter('lch')

/**
 * Nota según la familia del color buscado: marrón, gris/apagado u oscuro. `{ id, text }` o `null` (colores vivos, claros, etc.).
 * Marrón = tono naranja-amarillento (LCH 25–85°), croma moderado (12–60) y claridad baja o media (15–72).
 */
export function colorFamilyTip(target) {
  const { l, c, h } = toLch(target)
  if (l >= 15 && l <= 72 && c >= 12 && c <= 60 && h >= 25 && h <= 85) {
    return { id: 'brown', text: 'Un marrón se hace con rojo, amarillo y azul. Para oscurecerlo usá negro (o un azul muy oscuro); para aclararlo, blanco.' }
  }
  if (c < 10 && l >= 12 && l <= 88) {
    return { id: 'gray', text: 'Un gris se hace con blanco y negro. Sin ellos, mezclá los tres primarios en partes parecidas.' }
  }
  if (l < 28) {
    return { id: 'dark', text: 'Un color muy oscuro casi siempre lleva negro (o un azul muy oscuro) en la mezcla.' }
  }
  return null
}

const joinNames = (names) => (names.length <= 1 ? names[0] ?? '' : `${names.slice(0, -1).join(', ')} y ${names[names.length - 1]}`)

/** Frase del consejo completo, siempre con una acción o con lo más cerca que se llega. `null` si no hay plan. */
export function describePlan(plan) {
  if (!plan) return null
  const quality = plan.quality.toLowerCase()
  const summary = plan.recipe.parts.map((p) => `${p.parts} ${p.name}`).join(' · ')
  if (plan.roles.length === 0) {
    return `Con tus pinturas y la caja base lo más cerca que se llega es ${quality}.`
  }
  const names = joinNames(plan.roles.map((r) => r.name))
  const verb = plan.roles.length === 1 ? 'te falta' : 'te faltan'
  return plan.enough
    ? `Para este color ${verb}: ${names}. Con eso queda ${quality}: ${summary}.`
    : `Sumando ${names} te acercás todo lo que se puede: queda ${quality} (${summary}).`
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
  // Sin motivo de claridad ni intensidad es el tono: el remedio lo da `planMissingPaints`, qué colores sumar.
  if (out.length === 0) out.push({ code: 'need_hue', message: 'Al color le falta tono: mirá qué colores sumar.' })
  return out
}
