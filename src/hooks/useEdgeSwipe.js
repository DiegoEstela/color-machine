import { useEffect, useRef } from 'react'
import { SWIPE_MAX_SLOPE, SWIPE_MIN_DX, isRightSwipe } from '../lib/swipe.js'

export const EDGE_PX = 16 // el gesto tiene que empezar a menos de esta distancia del borde izquierdo
export { SWIPE_MAX_SLOPE, SWIPE_MIN_DX, isRightSwipe }

/**
 * Gesto de borde: deslizar hacia la derecha desde el borde izquierdo de la pantalla llama a `onSwipe`.
 * Usa eventos táctiles en `document` (no una franja): con eventos de puntero el navegador cancelaba el gesto
 * al ajustar el toque hacia el control más cercano. Es pasivo, así que no bloquea el scroll.
 * Se ignora sobre elementos con `data-no-edge-swipe` (por ejemplo la foto con zoom) y con `enabled=false`.
 */
export function useEdgeSwipe(onSwipe, enabled = true) {
  const callback = useRef(onSwipe)
  useEffect(() => { callback.current = onSwipe })

  useEffect(() => {
    if (!enabled) return undefined
    let start = null
    const onStart = (e) => {
      const t = e.touches?.[0]
      start = e.touches.length === 1 && t.clientX <= EDGE_PX && !e.target?.closest?.('[data-no-edge-swipe]')
        ? { id: t.identifier, x: t.clientX, y: t.clientY }
        : null
    }
    const onEnd = (e) => {
      const s = start
      start = null
      const t = s && [...e.changedTouches].find((c) => c.identifier === s.id)
      if (t && isRightSwipe(t.clientX - s.x, t.clientY - s.y)) callback.current?.()
    }
    const onCancel = () => { start = null }
    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchend', onEnd, { passive: true })
    document.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchend', onEnd)
      document.removeEventListener('touchcancel', onCancel)
    }
  }, [enabled])
}
