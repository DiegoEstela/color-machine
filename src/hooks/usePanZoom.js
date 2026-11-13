import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { IDENTITY, ZOOM_STEP, panBy, pinchTransform, screenToImage, toggleZoom, zoomAt } from '../lib/zoom.js'

const TAP_SLOP = 8 // px: por debajo es un toque, por encima es un arrastre
const TAP_MAX_MS = 500
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_DISTANCE = 24

/**
 * Zoom y desplazamiento dentro de un marco, con un dedo, dos dedos, rueda y doble toque.
 * - `frameRef` va en el marco (recorta con overflow:hidden) y `stageRef` en el escenario que se transforma.
 * - `resetKey` (por ejemplo la foto) vuelve a 1× cuando cambia.
 * - `onTap(punto)` recibe el punto tocado en coordenadas normalizadas de la foto (0–1).
 * Los hijos que manejan sus propios gestos llevan `data-own-gesture`: sin valor (botones) el marco los ignora;
 * con `data-own-gesture="drag"` (recuadro de recorte) el marco no mueve la foto pero sí cuenta el doble toque.
 */
export function usePanZoom({ resetKey, onTap } = {}) {
  const frameRef = useRef(null)
  const stageRef = useRef(null)
  const [state, setState] = useState({ key: resetKey, t: IDENTITY })
  const transform = state.key === resetKey ? state.t : IDENTITY

  const transformRef = useRef(transform)
  useEffect(() => { transformRef.current = transform })
  const onTapRef = useRef(onTap)
  useEffect(() => { onTapRef.current = onTap })

  const apply = useCallback((next) => {
    transformRef.current = next
    setState({ key: resetKey, t: next })
  }, [resetKey])

  // Tamaño del marco a 1× (lo que mide el escenario sin transformar) y origen del marco en pantalla.
  const getFrame = () => ({ w: stageRef.current?.offsetWidth ?? 0, h: stageRef.current?.offsetHeight ?? 0 })
  const toLocal = (e) => {
    const f = frameRef.current
    const r = f.getBoundingClientRect()
    return { x: e.clientX - r.left - f.clientLeft, y: e.clientY - r.top - f.clientTop }
  }

  const g = useRef({ pointers: new Map(), pinch: null, pan: null, tap: null, lastTap: null, blocked: false })

  const onPointerDownCapture = (e) => {
    const s = g.current
    const ownEl = e.target.closest?.('[data-own-gesture]')
    const own = Boolean(ownEl)
    const draggable = ownEl?.getAttribute('data-own-gesture') === 'drag'
    const p = toLocal(e)
    s.pointers.set(e.pointerId, { x: p.x, y: p.y, start: p, own })
    if (s.pointers.size === 1) {
      s.blocked = false
      s.pan = null
      s.tap = !own || draggable ? { x: p.x, y: p.y, t: performance.now(), own } : null
      if (!own) frameRef.current.setPointerCapture?.(e.pointerId)
    } else if (s.pointers.size === 2) {
      // Segundo dedo: empieza el pellizco y se cancela cualquier arrastre o toque.
      const [a, b] = [...s.pointers.values()]
      s.pinch = { start: transformRef.current, a0: { x: a.x, y: a.y }, b0: { x: b.x, y: b.y }, ids: [...s.pointers.keys()] }
      s.blocked = true
      s.pan = null
      s.tap = null
    }
  }

  const onPointerMove = (e) => {
    const s = g.current
    const rec = s.pointers.get(e.pointerId)
    if (!rec) return
    const p = toLocal(e)
    rec.x = p.x
    rec.y = p.y
    if (s.pinch) {
      const a = s.pointers.get(s.pinch.ids[0])
      const b = s.pointers.get(s.pinch.ids[1])
      if (a && b) apply(pinchTransform(s.pinch.start, s.pinch.a0, s.pinch.b0, a, b, getFrame()))
      return
    }
    if (s.blocked || rec.own) return
    if (!s.pan) {
      // el arrastre empieza al pasar el umbral; así un toque con el dedo algo movido no corre la foto
      if (Math.hypot(p.x - rec.start.x, p.y - rec.start.y) > TAP_SLOP) { s.pan = { x: p.x, y: p.y }; s.tap = null }
      return
    }
    apply(panBy(transformRef.current, p.x - s.pan.x, p.y - s.pan.y, getFrame()))
    s.pan = { x: p.x, y: p.y }
  }

  const finishPointer = (e, cancelled) => {
    const s = g.current
    if (!s.pointers.has(e.pointerId)) return
    const p = toLocal(e)
    s.pointers.delete(e.pointerId)
    if (s.pinch && s.pointers.size < 2) s.pinch = null // el dedo que queda no mueve la foto
    if (s.pointers.size > 0) return
    const tap = s.tap
    s.tap = null
    s.pan = null
    const wasBlocked = s.blocked
    s.blocked = false
    const now = performance.now()
    if (cancelled || wasBlocked || !tap || now - tap.t > TAP_MAX_MS) return
    if (Math.hypot(p.x - tap.x, p.y - tap.y) > TAP_SLOP) return // se movió: fue un arrastre, no un toque
    const last = s.lastTap
    if (last && now - last.t < DOUBLE_TAP_MS && Math.hypot(p.x - last.x, p.y - last.y) < DOUBLE_TAP_DISTANCE) {
      s.lastTap = null
      apply(toggleZoom(transformRef.current, p, getFrame()))
      return
    }
    s.lastTap = { x: p.x, y: p.y, t: now }
    if (tap.own) return // un toque sobre el recuadro no elige un color; solo cuenta para el doble toque
    const frame = getFrame()
    if (frame.w > 0 && frame.h > 0) onTapRef.current?.(screenToImage(transformRef.current, frame, p))
  }

  // La rueda (y el pellizco del trackpad) y los gestos de Safari se escuchan de forma nativa para poder
  // cancelarlos: así hacen zoom en la foto y no en la página.
  useEffect(() => {
    const el = frameRef.current
    if (!el) return undefined
    const onWheel = (e) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const point = { x: e.clientX - r.left - el.clientLeft, y: e.clientY - r.top - el.clientTop }
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002))
      apply(zoomAt(transformRef.current, factor, point, getFrame()))
    }
    const block = (e) => e.preventDefault()
    const gestures = ['gesturestart', 'gesturechange', 'gestureend']
    el.addEventListener('wheel', onWheel, { passive: false })
    gestures.forEach((name) => el.addEventListener(name, block))
    return () => {
      el.removeEventListener('wheel', onWheel)
      gestures.forEach((name) => el.removeEventListener(name, block))
    }
  }, [apply])

  const center = () => { const f = getFrame(); return { x: f.w / 2, y: f.h / 2 } }
  const zoomIn = () => apply(zoomAt(transformRef.current, ZOOM_STEP, center(), getFrame()))
  const zoomOut = () => apply(zoomAt(transformRef.current, 1 / ZOOM_STEP, center(), getFrame()))
  const reset = () => apply(IDENTITY)

  // Para los hijos (recuadro, mira): medidas actuales y si hay un gesto de zoom en curso.
  const api = useMemo(() => ({
    getMetrics: () => ({ ...getFrame(), scale: transformRef.current.scale }),
    isGesturing: () => g.current.blocked,
  }), [])

  return {
    frameRef, stageRef, transform, zoomIn, zoomOut, reset, api,
    handlers: {
      onPointerDownCapture,
      onPointerMove,
      onPointerUp: (e) => finishPointer(e, false),
      onPointerCancel: (e) => finishPointer(e, true),
    },
  }
}
