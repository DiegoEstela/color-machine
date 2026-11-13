import { converter, formatHex } from 'culori'

const toHsl = converter('hsl')
const toRgb = converter('rgb')

/** Acepta '#abc', '#aabbcc', 'abc' o 'aabbcc'. Devuelve '#rrggbb' en minúsculas, o null. */
export function normalizeHex(input) {
  if (typeof input !== 'string') return null
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(input.trim())
  if (!m) return null
  let h = m[1].toLowerCase()
  if (h.length === 3) h = [...h].map((c) => c + c).join('')
  return `#${h}`
}

export const isValidHex = (input) => normalizeHex(input) !== null

/** '#rrggbb' → { h: 0-360, s: 0-100, l: 0-100 }. Los grises tienen h = 0. */
export function hexToHsl(hex) {
  const c = toHsl(normalizeHex(hex))
  return { h: c.h ?? 0, s: (c.s ?? 0) * 100, l: (c.l ?? 0) * 100 }
}

/** { h, s, l } (grados, %, %) → '#rrggbb'. */
export function hslToHex({ h, s, l }) {
  return formatHex({ mode: 'hsl', h, s: s / 100, l: l / 100 })
}

/** '#rrggbb' → [r, g, b] en 0-255 (para dibujar píxeles). */
export function hslToRgb255({ h, s, l }) {
  const c = toRgb({ mode: 'hsl', h, s: s / 100, l: l / 100 })
  return [c.r, c.g, c.b].map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255))
}

/**
 * Punto de la rueda → HSL. (x, y) relativos al centro, con y hacia abajo.
 * El ángulo es el matiz y la distancia al centro la saturación. Fuera del círculo → null.
 */
export function wheelPointToHsl(x, y, radius, lightness) {
  const dist = Math.hypot(x, y)
  if (dist > radius) return null
  const h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  return { h, s: (dist / radius) * 100, l: lightness }
}

/** HSL → posición relativa al centro en la rueda (inverso de wheelPointToHsl). */
export function hslToWheelPoint({ h, s }, radius) {
  const r = (s / 100) * radius
  const a = (h * Math.PI) / 180
  return { x: Math.cos(a) * r, y: Math.sin(a) * r }
}

/**
 * Promedio de color de un cuadrado de (2·radius+1)² píxeles centrado en (x, y).
 * `imageData` = { data, width, height } (RGBA). Ignora píxeles transparentes y recorta a los bordes.
 * Devuelve null si no hay píxeles opacos.
 */
export function averageRegion({ data, width, height }, x, y, radius = 2) {
  let r = 0, g = 0, b = 0, n = 0
  const x0 = Math.max(0, Math.round(x) - radius)
  const x1 = Math.min(width - 1, Math.round(x) + radius)
  const y0 = Math.max(0, Math.round(y) - radius)
  const y1 = Math.min(height - 1, Math.round(y) + radius)
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const i = (py * width + px) * 4
      if (data[i + 3] === 0) continue
      r += data[i]; g += data[i + 1]; b += data[i + 2]; n++
    }
  }
  if (n === 0) return null
  return formatHex({ mode: 'rgb', r: r / n / 255, g: g / n / 255, b: b / n / 255 })
}
