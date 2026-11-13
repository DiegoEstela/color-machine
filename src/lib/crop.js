/** Rectángulos de recorte normalizados: { x, y, w, h } en 0–1 respecto de la imagen. */
export const MIN_SIZE = 0.05

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

export const defaultRect = () => ({ x: 0.35, y: 0.35, w: 0.3, h: 0.3 })

/** Mantiene el rectángulo dentro de la imagen y con al menos `min` de lado. */
export function clampRect(rect, min = MIN_SIZE) {
  const w = clamp(rect.w, min, 1)
  const h = clamp(rect.h, min, 1)
  return { x: clamp(rect.x, 0, 1 - w), y: clamp(rect.y, 0, 1 - h), w, h }
}

export const moveRect = (rect, dx, dy) => clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy })

/** Redimensiona arrastrando una esquina: 'nw' | 'ne' | 'sw' | 'se'. El lado opuesto queda fijo. */
export function resizeRect(rect, handle, dx, dy, min = MIN_SIZE) {
  let left = rect.x
  let top = rect.y
  let right = rect.x + rect.w
  let bottom = rect.y + rect.h
  if (handle.includes('w')) left = clamp(left + dx, 0, right - min)
  if (handle.includes('e')) right = clamp(right + dx, left + min, 1)
  if (handle.includes('n')) top = clamp(top + dy, 0, bottom - min)
  if (handle.includes('s')) bottom = clamp(bottom + dy, top + min, 1)
  return { x: left, y: top, w: right - left, h: bottom - top }
}
