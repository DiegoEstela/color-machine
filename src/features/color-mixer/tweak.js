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
const GAP_TONE = 3 // desplazamiento en el plano a-b de Lab desde el que se dice "tira a…"

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
 * Hacia dónde se corre la mezcla respecto del color buscado en el plano a-b de Lab, tomando el eje dominante:
 * 'redder' (más a) | 'greener' (menos a) | 'yellower' (más b) | 'bluer' (menos b) | 'same'.
 * Es lo mismo que "qué le sobra" a la mezcla; lo que falta es lo contrario (si tira a azul, le falta amarillo).
 */
function toneShift(t, m) {
  const dx = m.a - t.a
  const dy = m.b - t.b
  if (Math.hypot(dx, dy) < GAP_TONE) return 'same'
  if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 'redder' : 'greener'
  return dy > 0 ? 'yellower' : 'bluer'
}

const TONE_WORD = { redder: 'rojo', greener: 'verde', yellower: 'amarillo', bluer: 'azul' }

/**
 * Cómo es la mezcla respecto del color que se busca, en palabras y sin números.
 * Devuelve `{ light: 'lighter'|'darker'|'same', vivid: 'more'|'duller'|'same', tone: 'redder'|'greener'|'yellower'|'bluer'|'same', sentences: [...] }`.
 */
export function describeGap(target, mix) {
  const t = toLab(target)
  const m = toLab(mix)
  const dL = m.l - t.l
  const dC = chroma(m) - chroma(t)
  const light = dL > GAP_LIGHT ? 'lighter' : dL < -GAP_LIGHT ? 'darker' : 'same'
  const vivid = dC > GAP_VIVID ? 'more' : dC < -GAP_VIVID ? 'duller' : 'same'
  const tone = toneShift(t, m)
  const amount = (n, lot) => (Math.abs(n) > lot ? 'bastante' : 'un poco')
  const sentences = []
  if (light !== 'same') sentences.push(`Tu mezcla es ${amount(dL, GAP_LOT)} ${light === 'lighter' ? 'más clara' : 'más oscura'} que tu color.`)
  if (vivid !== 'same') {
    const how = `${amount(dC, GAP_LOT * 1.5)} ${vivid === 'more' ? 'más intensa' : 'más apagada'}`
    sentences.push(sentences.length === 0 ? `Tu mezcla es ${how} que tu color.` : `Y es ${how}.`)
  }
  if (tone !== 'same') {
    sentences.push(sentences.length === 0 ? `Tu mezcla tira a ${TONE_WORD[tone]} comparada con tu color.` : `Y tira a ${TONE_WORD[tone]}.`)
  }
  if (sentences.length === 0) sentences.push('Tu mezcla tiene casi la misma luz, intensidad y tono que tu color.')
  return { light, vivid, tone, sentences }
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
}

/**
 * Traduce el diagnóstico del consejero (`advisor.diagnose`) a frases de "qué sumar" para el panel de ajuste.
 * El motivo de tono (`need_hue`) no tiene frase propia: lo explica el consejo completo (`planMissingPaints`).
 */
export const describeNeeds = (problems) => problems.map((p) => NEEDS[p.code]).filter(Boolean)
