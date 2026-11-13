import { describe, expect, it } from 'vitest'
import { deltaE, mixHex } from './mixer.js'

describe('mixHex', () => {
  it('con una sola pintura devuelve ese color', () => {
    expect(mixHex([{ hex: '#E4002B', parts: 3 }])).toBe('#e4002b')
  })
  it('ignora las pinturas con 0 partes', () => {
    expect(mixHex([{ hex: '#ff0000', parts: 1 }, { hex: '#0000ff', parts: 0 }])).toBe('#ff0000')
  })
  it('falla si no hay ninguna pintura con partes', () => {
    expect(() => mixHex([{ hex: '#ff0000', parts: 0 }])).toThrow()
  })
  it('mezcla como pigmentos, no como luz: amarillo + azul da verde', () => {
    const hex = mixHex([{ hex: '#fcd200', parts: 1 }, { hex: '#002185', parts: 1 }])
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    expect(g).toBeGreaterThan(r)
    expect(g).toBeGreaterThan(b)
  })
  it('es determinista y depende de las proporciones', () => {
    const a = [{ hex: '#e4002b', parts: 1 }, { hex: '#1d3fbb', parts: 3 }]
    expect(mixHex(a)).toBe(mixHex(a))
    expect(mixHex(a)).not.toBe(mixHex([{ hex: '#e4002b', parts: 3 }, { hex: '#1d3fbb', parts: 1 }]))
  })
})

describe('deltaE', () => {
  it('es 0 para el mismo color y grande para colores opuestos', () => {
    expect(deltaE('#e4002b', '#e4002b')).toBe(0)
    expect(deltaE('#ff0000', '#0000ff')).toBeGreaterThan(40)
  })
  it('una diferencia mínima queda por debajo de 1', () => {
    expect(deltaE('#ff0000', '#fe0000')).toBeLessThan(1)
  })
})
