import { clampChroma, converter, formatHex } from 'culori'
import { normalizeHex } from '../../lib/color.js'

const toLch = converter('lch')
const toLab = converter('lab')

export const TWEAK_LIMIT = 3 // pasos máximos hacia cada lado, para Luz y para Intensidad
export const LIGHT_STEP = 4 // cuánto se corre la claridad (L de Lab) por paso
export const VIVID_STEP = 1.12 // cuánto se multiplica la intensidad (croma) por paso
const GAP_LIGHT = 3 // diferencia de claridad desde la que se dice "más claro/oscuro"
const GAP_VIVID = 6 // diferencia de croma desde la que se dice "más intenso/apagado"
const GAP_LOT = 8 // y desde acá se dice "bastante" en vez de "un poco"

export const NEUTRAL_TWEAK = Object.freeze({ light: 0, vivid: 0 })

const clamp = (n) => Math.max(-TWEAK_LIMIT, Math.min(TWEAK_LIMIT, Math.round(Number(n) || 0)))

/** Ajuste válido: enteros entre -3 y +3 en cada eje (`light` = luz, `vivid` = intensidad). */
export const clampTweak = (t) => ({ light: clamp(t?.light), vivid: clamp(t?.vivid) })
export const isNeutral = (t) => !t || (clamp(t.light) === 0 && clamp(t.vivid) === 0)

/**
 * Color al que apunta el cálculo cuando el usuario pide "más luz" o "más intenso": mismo tono, claridad
 * corrida `LIGHT_STEP` por paso y croma multiplicado por `VIVID_STEP` por paso, recortado a lo que se puede mostrar.
 * Sin ajuste devuelve el mismo color.
 */
export function shiftTarget(hex, tweak) {
  const base = normalizeHex(hex)
  if (!base || isNeutral(tweak)) return base
  const { light, vivid } = clampTweak(tweak)
  const lch = toLch(base)
  const shifted = {
    mode: 'lch',
    l: Math.max(0, Math.min(100, lch.l + LIGHT_STEP * light)),
    c: Math.max(0, (lch.c ?? 0) * VIVID_STEP ** vivid),
    h: lch.h ?? 0,
  }
  return formatHex(clampChroma(shifted, 'lch')) ?? base
}

const chroma = (lab) => Math.hypot(lab.a, lab.b)

/**
 * Cómo es la mezcla respecto del color que se busca, en palabras y sin números.
 * Devuelve `{ light: 'lighter'|'darker'|'same', vivid: 'more'|'duller'|'same', sentences: [...] }`.
 */
export function describeGap(target, mix) {
  const t = toLab(target)
  const m = toLab(mix)
  const dL = m.l - t.l
  const dC = chroma(m) - chroma(t)
  const light = dL > GAP_LIGHT ? 'lighter' : dL < -GAP_LIGHT ? 'darker' : 'same'
  const vivid = dC > GAP_VIVID ? 'more' : dC < -GAP_VIVID ? 'duller' : 'same'
  const amount = (n, lot) => (Math.abs(n) > lot ? 'bastante' : 'un poco')
  const sentences = []
  if (light !== 'same') sentences.push(`Tu mezcla es ${amount(dL, GAP_LOT)} ${light === 'lighter' ? 'más clara' : 'más oscura'} que tu color.`)
  if (vivid !== 'same') {
    const how = `${amount(dC, GAP_LOT * 1.5)} ${vivid === 'more' ? 'más intensa' : 'más apagada'}`
    sentences.push(light === 'same' ? `Tu mezcla es ${how} que tu color.` : `Y es ${how}.`)
  }
  if (sentences.length === 0) sentences.push('Tu mezcla tiene casi la misma luz y la misma intensidad que tu color.')
  return { light, vivid, sentences }
}

/** Frase corta del ajuste activo ("Ajustada: +1 luz, −1 intensidad"); vacía si no hay ajuste. */
export function describeTweak(tweak) {
  const { light, vivid } = clampTweak(tweak)
  const fmt = (n, word) => `${n > 0 ? '+' : '−'}${Math.abs(n)} ${word}`
  const parts = []
  if (light) parts.push(fmt(light, 'luz'))
  if (vivid) parts.push(fmt(vivid, 'intensidad'))
  return parts.length ? `Ajustada: ${parts.join(', ')}` : ''
}

const NEEDS = {
  need_white: 'Te falta blanco para que quede más claro.',
  need_black: 'Te falta negro para que quede más oscuro.',
  need_vivid: 'Con estas pinturas no sale más intenso: probá con colores más puros.',
  need_hue: 'Falta una pintura de un tono parecido al tuyo.',
}

/** Traduce el diagnóstico del consejero (`advisor.diagnose`) a frases de "qué sumar" para el panel de ajuste. */
export const describeNeeds = (problems) => problems.map((p) => NEEDS[p.code]).filter(Boolean)
