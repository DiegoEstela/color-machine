/**
 * Zoom y desplazamiento de una foto dentro de un marco fijo.
 * Transformación: { scale, x, y } → un punto normalizado (nx, ny) de la foto cae en pantalla en
 * (x + scale·nx·ancho, y + scale·ny·alto), con `frame` = { w, h } el tamaño del marco a 1×.
 * La foto siempre cubre el marco: x ∈ [w·(1−scale), 0], y ∈ [h·(1−scale), 0].
 */
export const MIN_SCALE = 1
export const MAX_SCALE = 8
export const ZOOM_STEP = 1.5
export const DOUBLE_TAP_SCALE = 3
export const IDENTITY = { scale: 1, x: 0, y: 0 }

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y)
const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

/** Limita la escala a 1–8× y el desplazamiento para que la foto no deje huecos en el marco. */
export function clampTransform(t, frame) {
  const scale = clamp(t.scale, MIN_SCALE, MAX_SCALE)
  return {
    scale,
    x: clamp(t.x, Math.min(0, frame.w * (1 - scale)), 0),
    y: clamp(t.y, Math.min(0, frame.h * (1 - scale)), 0),
  }
}

/** Multiplica el zoom por `factor` dejando fijo el punto `point` (en píxeles del marco). */
export function zoomAt(t, factor, point, frame) {
  const scale = clamp(t.scale * factor, MIN_SCALE, MAX_SCALE)
  const k = scale / t.scale
  return clampTransform({ scale, x: point.x - (point.x - t.x) * k, y: point.y - (point.y - t.y) * k }, frame)
}

/** Mueve la foto `dx`, `dy` píxeles (sin salirse de los límites). */
export const panBy = (t, dx, dy, frame) => clampTransform({ ...t, x: t.x + dx, y: t.y + dy }, frame)

/**
 * Pellizco con dos dedos. `start` es la transformación al empezar, `a0`/`b0` las posiciones iniciales
 * de los dedos y `a1`/`b1` las actuales: la escala sigue la distancia entre dedos y el punto de la foto
 * que estaba bajo el centro inicial queda bajo el centro actual.
 */
export function pinchTransform(start, a0, b0, a1, b1, frame) {
  const d0 = distance(a0, b0)
  const factor = d0 === 0 ? 1 : distance(a1, b1) / d0
  const scale = clamp(start.scale * factor, MIN_SCALE, MAX_SCALE)
  const k = scale / start.scale
  const m0 = midpoint(a0, b0)
  const m1 = midpoint(a1, b1)
  return clampTransform({ scale, x: m1.x - (m0.x - start.x) * k, y: m1.y - (m0.y - start.y) * k }, frame)
}

/** Doble toque: si ya hay zoom vuelve a 1×; si no, acerca a `DOUBLE_TAP_SCALE`× alrededor del punto. */
export function toggleZoom(t, point, frame) {
  if (t.scale > MIN_SCALE + 0.01) return IDENTITY
  return zoomAt(t, DOUBLE_TAP_SCALE, point, frame)
}

/** Punto normalizado de la foto (0–1) → píxeles del marco. */
export const imageToScreen = (t, frame, n) => ({ x: t.x + t.scale * n.x * frame.w, y: t.y + t.scale * n.y * frame.h })

/** Píxeles del marco → punto normalizado de la foto (0–1). */
export const screenToImage = (t, frame, p) => ({
  x: (p.x - t.x) / (t.scale * frame.w),
  y: (p.y - t.y) / (t.scale * frame.h),
})

/** Texto del nivel de zoom: "1×", "1.5×", "8×". */
export const formatZoom = (scale) => `${Number(scale.toFixed(1))}×`
