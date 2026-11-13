import { describe, expect, it } from 'vitest'
import {
  normalizeHex, isValidHex, hexToHsl, hslToHex, wheelPointToHsl, hslToWheelPoint, averageRegion,
} from './color.js'

describe('normalizeHex', () => {
  it('acepta las cuatro formas', () => {
    expect(normalizeHex('#abc')).toBe('#aabbcc')
    expect(normalizeHex('#AABBCC')).toBe('#aabbcc')
    expect(normalizeHex('abc')).toBe('#aabbcc')
    expect(normalizeHex(' aabbcc ')).toBe('#aabbcc')
  })
  it('rechaza valores inválidos', () => {
    for (const bad of ['', '#ab', '#abcd', '#ggg', 'rojo', null, undefined, 12]) {
      expect(normalizeHex(bad)).toBeNull()
    }
    expect(isValidHex('#fff')).toBe(true)
    expect(isValidHex('zzz')).toBe(false)
  })
})

describe('hex <-> hsl', () => {
  it('convierte colores primarios', () => {
    expect(hexToHsl('#ff0000')).toMatchObject({ h: 0, s: 100, l: 50 })
    expect(hslToHex({ h: 120, s: 100, l: 50 })).toBe('#00ff00')
  })
  it('un gris tiene saturación 0 y matiz 0', () => {
    expect(hexToHsl('#808080')).toMatchObject({ h: 0, s: 0 })
  })
  it('ida y vuelta se mantiene dentro de 1 unidad por canal', () => {
    const a = '#e63946'
    const b = hslToHex(hexToHsl(a))
    for (let i = 1; i < 7; i += 2) {
      expect(Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16))).toBeLessThanOrEqual(1)
    }
  })
})

describe('wheel', () => {
  it('el centro es saturación 0 y el borde saturación 100', () => {
    expect(wheelPointToHsl(0, 0, 10, 50)).toMatchObject({ s: 0, l: 50 })
    expect(wheelPointToHsl(10, 0, 10, 50)).toMatchObject({ h: 0, s: 100 })
  })
  it('el ángulo da el matiz (y hacia abajo)', () => {
    expect(wheelPointToHsl(0, 10, 10, 50).h).toBeCloseTo(90)
    expect(wheelPointToHsl(-10, 0, 10, 50).h).toBeCloseTo(180)
    expect(wheelPointToHsl(0, -10, 10, 50).h).toBeCloseTo(270)
  })
  it('fuera del círculo devuelve null', () => {
    expect(wheelPointToHsl(8, 8, 10, 50)).toBeNull()
  })
  it('hslToWheelPoint es el inverso', () => {
    const p = hslToWheelPoint({ h: 90, s: 50 }, 10)
    expect(p.x).toBeCloseTo(0)
    expect(p.y).toBeCloseTo(5)
    const hsl = wheelPointToHsl(p.x, p.y, 10, 50)
    expect(hsl.h).toBeCloseTo(90)
    expect(hsl.s).toBeCloseTo(50)
  })
})

describe('averageRegion', () => {
  const make = (w, h, fill) => {
    const data = new Uint8ClampedArray(w * h * 4)
    for (let i = 0; i < w * h; i++) data.set(fill(i), i * 4)
    return { data, width: w, height: h }
  }
  it('promedia una región uniforme', () => {
    expect(averageRegion(make(10, 10, () => [255, 0, 0, 255]), 5, 5)).toBe('#ff0000')
  })
  it('promedia colores distintos', () => {
    const img = make(4, 1, (i) => (i < 2 ? [255, 255, 255, 255] : [0, 0, 0, 255]))
    expect(averageRegion(img, 1, 0, 3)).toBe('#808080')
  })
  it('recorta en los bordes sin fallar', () => {
    expect(averageRegion(make(3, 3, () => [0, 0, 255, 255]), 0, 0, 2)).toBe('#0000ff')
  })
  it('ignora píxeles transparentes y devuelve null si no hay ninguno', () => {
    expect(averageRegion(make(3, 3, () => [9, 9, 9, 0]), 1, 1)).toBeNull()
    const img = make(2, 1, (i) => (i === 0 ? [255, 0, 0, 255] : [0, 255, 0, 0]))
    expect(averageRegion(img, 0, 0, 2)).toBe('#ff0000')
  })
})
