import { Color, mix } from 'spectral.js'
import { differenceCiede2000 } from 'culori'

const diff = differenceCiede2000()
const colorCache = new Map() // construir un Color es lo más caro: se reutiliza por hex

const toColor = (hex) => {
  let c = colorCache.get(hex)
  if (!c) { c = new Color(hex); colorCache.set(hex, c) }
  return c
}

/**
 * Color resultante de mezclar pigmentos (Kubelka-Munk, spectral.js).
 * `entries` = [{ hex, parts }]; ignora las de 0 partes. Devuelve '#rrggbb' en minúsculas.
 */
export function mixHex(entries) {
  const used = entries.filter((e) => e.parts > 0)
  if (used.length === 0) throw new Error('mixHex necesita al menos una pintura con partes > 0')
  if (used.length === 1) return used[0].hex.toLowerCase()
  return mix(...used.map((e) => [toColor(e.hex), e.parts])).toString().toLowerCase()
}

/** Diferencia de color perceptual (ΔE 2000). 0 = idénticos; ~2 apenas se nota; > 10 son colores distintos. */
export const deltaE = (hexA, hexB) => diff(hexA, hexB)
