import { describe, expect, it } from 'vitest'
import { describeQuality, enumerateRecipes, solve, PRECISION, DEFAULT_MAX_PARTS } from './solver.js'
import { deltaE, mixHex } from './mixer.js'
import { BASE_PAINTS } from './referencePaints.js'

const [rojo, amarillo, azul, blanco, negro] = BASE_PAINTS
const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b))

describe('enumerateRecipes', () => {
  it('genera solo recetas primitivas con 1..maxParts partes', () => {
    const key = (r) => r.join(':')
    expect(enumerateRecipes(2, 3).map(key).sort()).toEqual(['0:1', '1:0', '1:1', '1:2', '2:1'])
  })
  it('no repite múltiplos (2:2, 4:2) ni pasa del máximo', () => {
    const all = enumerateRecipes(3, 6)
    for (const r of all) {
      expect(r.reduce((g, v) => gcd(g, v), 0)).toBe(1)
      expect(r.reduce((s, v) => s + v, 0)).toBeLessThanOrEqual(6)
    }
    expect(all.map((r) => r.join(':'))).not.toContain('2:2:0')
    expect(all.map((r) => r.join(':'))).not.toContain('4:2:0')
  })
  it('respeta la cantidad máxima de pinturas distintas', () => {
    for (const r of enumerateRecipes(5, 8, 2)) expect(r.filter((v) => v > 0).length).toBeLessThanOrEqual(2)
  })
  it('es determinista', () => {
    expect(enumerateRecipes(4, 7)).toEqual(enumerateRecipes(4, 7))
  })
})

describe('describeQuality', () => {
  it.each([
    [0, 'Casi idéntico'], [1.99, 'Casi idéntico'],
    [2, 'Muy parecido'], [4.99, 'Muy parecido'],
    [5, 'Parecido'], [9.99, 'Parecido'],
    [10, 'Aproximado'], [40, 'Aproximado'],
  ])('ΔE %s → %s', (dE, text) => expect(describeQuality(dE)).toBe(text))
})

describe('solve', () => {
  it('sin pinturas devuelve null', () => {
    expect(solve({ target: '#ff0000', paints: [] })).toBeNull()
  })

  it('si una pintura ya es el objetivo, la receta es 1 parte de esa pintura sola', () => {
    const { recommended, best } = solve({ target: rojo.hex, paints: [rojo, azul] })
    expect(recommended.parts).toEqual([{ paintId: rojo.id, name: 'Rojo', hex: rojo.hex, parts: 1 }])
    expect(recommended.deltaE).toBeCloseTo(0)
    expect(best.total).toBe(1)
  })

  it('encuentra las proporciones exactas de una mezcla conocida', () => {
    const target = mixHex([{ hex: rojo.hex, parts: 1 }, { hex: azul.hex, parts: 2 }])
    const { best, recommended } = solve({ target, paints: [rojo, amarillo, azul] })
    expect(best.parts.map((p) => [p.name, p.parts])).toEqual([['Rojo', 1], ['Azul', 2]])
    expect(best.deltaE).toBeCloseTo(0)
    expect(recommended.parts.map((p) => [p.name, p.parts])).toEqual([['Rojo', 1], ['Azul', 2]])
  })

  it('rojo + azul para un violeta usa ambas con partes enteras y mejora a cada una por separado', () => {
    const target = '#5b2a86'
    const { recommended } = solve({ target, paints: [rojo, azul] })
    expect(recommended.parts.map((p) => p.name)).toEqual(['Rojo', 'Azul'])
    for (const p of recommended.parts) expect(Number.isInteger(p.parts) && p.parts > 0).toBe(true)
    expect(recommended.deltaE).toBeLessThan(Math.min(deltaE(target, rojo.hex), deltaE(target, azul.hex)))
  })

  it('la recomendada nunca tiene más partes que la más exacta y su ΔE la sigue de cerca', () => {
    for (const target of ['#5b2a86', '#f4a261', '#2a9d8f', '#bdbdbd', '#ffb3c6']) {
      const { recommended, best } = solve({ target, paints: BASE_PAINTS })
      expect(recommended.total).toBeLessThanOrEqual(best.total)
      expect(recommended.deltaE).toBeLessThanOrEqual(best.deltaE + 1 + 1e-9)
      expect(best.deltaE).toBeLessThanOrEqual(recommended.deltaE + 1e-9)
    }
  })

  it('devuelve recetas primitivas y respeta maxParts', () => {
    const { best, recommended, alternatives } = solve({ target: '#f4a261', paints: BASE_PAINTS, maxParts: 8 })
    for (const r of [best, recommended, ...alternatives]) {
      expect(r.total).toBeLessThanOrEqual(8)
      expect(r.parts.map((p) => p.parts).reduce((g, v) => gcd(g, v), 0)).toBe(1)
    }
  })

  it('las alternativas son como máximo 2 y se distinguen a simple vista', () => {
    const { best, recommended, alternatives } = solve({ target: '#f4a261', paints: BASE_PAINTS })
    expect(alternatives.length).toBeLessThanOrEqual(2)
    const all = [best, recommended, ...alternatives]
    alternatives.forEach((alt) => {
      expect(all.filter((r) => r !== alt).every((r) => deltaE(r.mixHex, alt.mixHex) >= 1)).toBe(true)
    })
  })

  it('es determinista', () => {
    const input = { target: '#5b2a86', paints: BASE_PAINTS }
    expect(solve(input)).toEqual(solve(input))
  })

  it('cada receta trae su ΔE y la calidad en palabras', () => {
    const { best } = solve({ target: '#bdbdbd', paints: [blanco, negro] })
    expect(best.quality).toBe(describeQuality(best.deltaE))
    expect(best.deltaE).toBeCloseTo(deltaE('#bdbdbd', best.mixHex))
  })

  it('con 6 pinturas y el máximo por defecto tarda menos de 1 segundo', () => {
    const six = [...BASE_PAINTS, { id: 'v', name: 'Verde', hex: '#2a9d8f' }]
    const t0 = performance.now()
    solve({ target: '#5b2a86', paints: six, maxParts: DEFAULT_MAX_PARTS })
    expect(performance.now() - t0).toBeLessThan(1000)
  })

  it('los niveles de precisión son 6, 10 y 16 partes', () => {
    expect(PRECISION).toEqual({ simple: 6, normal: 10, preciso: 16 })
    expect(DEFAULT_MAX_PARTS).toBe(10)
  })
})
