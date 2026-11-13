import { describe, expect, it } from 'vitest'
import { MIN_SIZE, clampRect, defaultRect, moveRect, resizeRect } from './crop.js'

describe('crop', () => {
  it('el rectángulo por defecto queda centrado y dentro de la imagen', () => {
    const r = defaultRect()
    expect(r.x + r.w).toBeLessThanOrEqual(1)
    expect(r.x).toBeCloseTo(1 - r.x - r.w)
  })
  it('clampRect respeta límites y tamaño mínimo', () => {
    expect(clampRect({ x: -1, y: 2, w: 0.2, h: 0.2 })).toEqual({ x: 0, y: 0.8, w: 0.2, h: 0.2 })
    expect(clampRect({ x: 0, y: 0, w: 0, h: 5 })).toMatchObject({ w: MIN_SIZE, h: 1 })
  })
  it('moveRect no se sale de la imagen', () => {
    const r = moveRect({ x: 0.5, y: 0.5, w: 0.4, h: 0.4 }, 1, -1)
    expect(r).toEqual({ x: 0.6, y: 0, w: 0.4, h: 0.4 })
  })
  it('resizeRect mueve solo los lados de la esquina y deja fijo el opuesto', () => {
    const base = { x: 0.2, y: 0.2, w: 0.4, h: 0.4 }
    const se = resizeRect(base, 'se', 0.1, 0.2)
    expect(se.x).toBeCloseTo(0.2); expect(se.y).toBeCloseTo(0.2)
    expect(se.w).toBeCloseTo(0.5); expect(se.h).toBeCloseTo(0.6)
    const nw = resizeRect(base, 'nw', -0.1, -0.1)
    expect(nw.x).toBeCloseTo(0.1); expect(nw.y).toBeCloseTo(0.1)
    expect(nw.x + nw.w).toBeCloseTo(0.6); expect(nw.y + nw.h).toBeCloseTo(0.6)
  })
  it('resizeRect no pasa del borde ni invierte el rectángulo', () => {
    const base = { x: 0.2, y: 0.2, w: 0.4, h: 0.4 }
    const big = resizeRect(base, 'se', 5, 5)
    expect(big.x + big.w).toBeCloseTo(1); expect(big.y + big.h).toBeCloseTo(1)
    const tiny = resizeRect(base, 'se', -5, -5)
    expect(tiny.w).toBeCloseTo(MIN_SIZE); expect(tiny.h).toBeCloseTo(MIN_SIZE)
    const flip = resizeRect(base, 'nw', 5, 5)
    expect(flip.w).toBeCloseTo(MIN_SIZE)
    expect(flip.x + flip.w).toBeCloseTo(0.6)
  })
})
