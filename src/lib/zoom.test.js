import { describe, expect, it } from 'vitest'
import {
  DOUBLE_TAP_SCALE, IDENTITY, MAX_SCALE, MIN_SCALE, clampTransform, formatZoom, imageToScreen, panBy,
  pinchTransform, screenToImage, toggleZoom, zoomAt,
} from './zoom.js'

const FRAME = { w: 200, h: 100 }
const near = (a, b) => expect(a).toBeCloseTo(b, 6)

describe('clampTransform', () => {
  it('limita la escala a 1–8×', () => {
    expect(clampTransform({ scale: 0.2, x: 0, y: 0 }, FRAME).scale).toBe(MIN_SCALE)
    expect(clampTransform({ scale: 50, x: 0, y: 0 }, FRAME).scale).toBe(MAX_SCALE)
  })
  it('a 1× no hay desplazamiento posible', () => {
    expect(clampTransform({ scale: 1, x: 40, y: -30 }, FRAME)).toEqual({ scale: 1, x: 0, y: 0 })
  })
  it('con zoom la foto siempre cubre el marco', () => {
    const t = clampTransform({ scale: 2, x: 50, y: -999 }, FRAME)
    expect(t).toEqual({ scale: 2, x: 0, y: -100 }) // y mínimo = h·(1−2)
    expect(clampTransform({ scale: 2, x: -999, y: 10 }, FRAME)).toEqual({ scale: 2, x: -200, y: 0 })
  })
})

describe('zoomAt', () => {
  it('acerca dejando fijo el punto elegido', () => {
    const p = { x: 120, y: 40 }
    const before = screenToImage(IDENTITY, FRAME, p)
    const t = zoomAt(IDENTITY, 2, p, FRAME)
    expect(t.scale).toBe(2)
    const after = imageToScreen(t, FRAME, before)
    near(after.x, p.x)
    near(after.y, p.y)
  })
  it('en una esquina no deja huecos', () => {
    const t = zoomAt(IDENTITY, 4, { x: 0, y: 0 }, FRAME)
    expect(t).toEqual({ scale: 4, x: 0, y: 0 })
    const far = zoomAt(IDENTITY, 4, { x: 200, y: 100 }, FRAME)
    expect(far).toEqual({ scale: 4, x: -600, y: -300 })
  })
  it('no pasa de 8× ni baja de 1×', () => {
    expect(zoomAt({ scale: 6, x: 0, y: 0 }, 5, { x: 10, y: 10 }, FRAME).scale).toBe(MAX_SCALE)
    expect(zoomAt({ scale: 2, x: 0, y: 0 }, 0.1, { x: 10, y: 10 }, FRAME).scale).toBe(MIN_SCALE)
  })
  it('alejar hasta 1× vuelve a la transformación inicial', () => {
    const zoomed = zoomAt(IDENTITY, 3, { x: 150, y: 70 }, FRAME)
    expect(zoomAt(zoomed, 1 / 3, { x: 150, y: 70 }, FRAME)).toEqual(IDENTITY)
  })
})

describe('panBy', () => {
  it('mueve la foto con zoom y respeta los límites', () => {
    const t = { scale: 2, x: -50, y: -20 }
    expect(panBy(t, 30, 10, FRAME)).toEqual({ scale: 2, x: -20, y: -10 })
    expect(panBy(t, 500, 500, FRAME)).toEqual({ scale: 2, x: 0, y: 0 })
    expect(panBy(t, -500, -500, FRAME)).toEqual({ scale: 2, x: -200, y: -100 })
  })
  it('a 1× no mueve nada', () => {
    expect(panBy(IDENTITY, 40, 40, FRAME)).toEqual(IDENTITY)
  })
})

describe('pinchTransform', () => {
  const a0 = { x: 60, y: 50 }
  const b0 = { x: 140, y: 50 }
  it('separar los dedos acerca (escala = proporción de la distancia)', () => {
    const t = pinchTransform(IDENTITY, a0, b0, { x: 40, y: 50 }, { x: 160, y: 50 }, FRAME)
    near(t.scale, 1.5)
  })
  it('juntar los dedos aleja y no baja de 1×', () => {
    const zoomed = { scale: 2, x: -100, y: -50 }
    const t = pinchTransform(zoomed, a0, b0, { x: 90, y: 50 }, { x: 110, y: 50 }, FRAME)
    expect(t.scale).toBe(MIN_SCALE)
  })
  it('el punto bajo el centro de los dedos se queda bajo el centro', () => {
    const m = { x: 100, y: 50 }
    const before = screenToImage(IDENTITY, FRAME, m)
    const t = pinchTransform(IDENTITY, a0, b0, { x: 20, y: 50 }, { x: 180, y: 50 }, FRAME)
    const after = imageToScreen(t, FRAME, before)
    near(after.x, m.x)
    near(after.y, m.y)
  })
  it('mover los dos dedos juntos desplaza la foto sin cambiar la escala', () => {
    const start = { scale: 2, x: -100, y: -50 }
    const t = pinchTransform(start, a0, b0, { x: 80, y: 50 }, { x: 160, y: 50 }, FRAME)
    expect(t.scale).toBe(2)
    near(t.x, -80)
  })
  it('con los dedos en el mismo punto no rompe', () => {
    const t = pinchTransform(IDENTITY, a0, a0, { x: 10, y: 10 }, { x: 90, y: 90 }, FRAME)
    expect(t.scale).toBe(1)
  })
})

describe('toggleZoom', () => {
  it('sin zoom acerca a 3× alrededor del punto', () => {
    expect(toggleZoom(IDENTITY, { x: 100, y: 50 }, FRAME).scale).toBe(DOUBLE_TAP_SCALE)
  })
  it('con zoom vuelve a 1×', () => {
    expect(toggleZoom({ scale: 2.5, x: -10, y: -10 }, { x: 100, y: 50 }, FRAME)).toEqual(IDENTITY)
  })
})

describe('conversiones', () => {
  it('imageToScreen y screenToImage son inversas', () => {
    const t = { scale: 3, x: -120, y: -60 }
    const n = { x: 0.37, y: 0.81 }
    const back = screenToImage(t, FRAME, imageToScreen(t, FRAME, n))
    near(back.x, n.x)
    near(back.y, n.y)
  })
  it('a 1× el punto normalizado es proporcional al marco', () => {
    expect(imageToScreen(IDENTITY, FRAME, { x: 0.5, y: 0.5 })).toEqual({ x: 100, y: 50 })
    expect(screenToImage(IDENTITY, FRAME, { x: 50, y: 25 })).toEqual({ x: 0.25, y: 0.25 })
  })
})

describe('formatZoom', () => {
  it.each([[1, '1×'], [1.5, '1.5×'], [2.25, '2.3×'], [8, '8×']])('%s → %s', (s, text) => {
    expect(formatZoom(s)).toBe(text)
  })
})
