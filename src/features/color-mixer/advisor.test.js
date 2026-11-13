import { describe, expect, it } from 'vitest'
import { adviseBasePaints, diagnose, matchPaints, suggestAdditions } from './advisor.js'
import { BASE_PAINTS } from './referencePaints.js'
import { mixHex } from './mixer.js'
import { solve } from './solver.js'

const [rojo, amarillo, azul, blanco, negro] = BASE_PAINTS
const names = (advice) => advice.roles.map((r) => r.name)
const mixOf = (...entries) => mixHex(entries.map(([p, parts]) => ({ hex: p.hex, parts })))

describe('adviseBasePaints', () => {
  it('un violeta pide rojo y azul', () => {
    const roles = names(adviseBasePaints('#7b2cbf'))
    expect(roles).toContain('Rojo')
    expect(roles).toContain('Azul')
    expect(roles).not.toContain('Amarillo')
  })
  it('una mezcla de rojo y azul pide exactamente esas dos', () => {
    expect(names(adviseBasePaints(mixOf([rojo, 1], [azul, 2])))).toEqual(['Rojo', 'Azul'])
  })
  it('un rosa pastel pide rojo y blanco', () => {
    expect(names(adviseBasePaints(mixOf([rojo, 1], [blanco, 3])))).toEqual(['Rojo', 'Blanco'])
  })
  it('un gris pide blanco y negro', () => {
    expect(names(adviseBasePaints('#8a8a8a'))).toEqual(['Blanco', 'Negro'])
  })
  it('un color igual a una pintura base pide solo esa', () => {
    expect(names(adviseBasePaints(amarillo.hex))).toEqual(['Amarillo'])
    expect(names(adviseBasePaints(negro.hex))).toEqual(['Negro'])
  })
  it('un verde pide amarillo y azul', () => {
    const roles = names(adviseBasePaints(mixOf([amarillo, 1], [azul, 1])))
    expect(roles).toEqual(['Amarillo', 'Azul'])
  })
})

describe('matchPaints', () => {
  const roles = [rojo, azul, blanco]
  const user = (id, hex, name = id) => ({ id, name, hex })

  it('marca "la tenés" para las bases que el usuario ya guardó y "falta" para el resto', () => {
    const res = matchPaints(roles, [user('r', '#c1121f', 'Mi rojo'), user('b', '#fafafa', 'Mi blanco')])
    expect(res.map((m) => [m.role.name, m.status])).toEqual([['Rojo', 'have'], ['Azul', 'missing'], ['Blanco', 'have']])
    expect(res[0].paint.name).toBe('Mi rojo')
  })
  it('sin pinturas guardadas falta todo', () => {
    expect(matchPaints(roles, []).every((m) => m.status === 'missing')).toBe(true)
  })
  it('una misma pintura no cubre dos bases', () => {
    const res = matchPaints([rojo, amarillo], [user('n', '#f58a07', 'Naranja')])
    expect(res.filter((m) => m.status === 'have')).toHaveLength(1)
  })
  it('si hay dos pinturas parecidas, la más cercana a la base es la que cuenta', () => {
    const res = matchPaints([rojo], [user('a', '#a01020', 'Rojo oscuro'), user('b', '#e0102f', 'Rojo vivo')])
    expect(res[0].paint.name).toBe('Rojo vivo')
  })
  it('un color muy distinto de todas las bases no cuenta', () => {
    const res = matchPaints(roles, [user('v', '#2a9d8f', 'Turquesa')])
    expect(res.every((m) => m.status === 'missing')).toBe(true)
  })
})

describe('suggestAdditions', () => {
  it('no sugiere nada si las pinturas ya alcanzan', () => {
    const target = mixOf([rojo, 1], [azul, 2])
    expect(suggestAdditions(target, [rojo, azul])).toEqual([])
  })
  it('para un tono pastel con solo rojo y azul sugiere blanco, y al sumarlo el resultado mejora', () => {
    const target = mixOf([rojo, 1], [azul, 1], [blanco, 4])
    const before = solve({ target, paints: [rojo, azul], maxParts: 6, maxPaints: 3 }).best.deltaE
    const [first] = suggestAdditions(target, [rojo, azul])
    expect(first.role.name).toBe('Blanco')
    expect(first.improvement).toBeGreaterThanOrEqual(1)
    expect(first.deltaE).toBeLessThan(before)
    const after = solve({ target, paints: [rojo, azul, blanco], maxParts: 6, maxPaints: 3 }).best.deltaE
    expect(after).toBeCloseTo(first.deltaE)
  })
  it('para un tono oscuro sugiere negro', () => {
    const target = mixOf([rojo, 1], [azul, 1], [negro, 3])
    const [first] = suggestAdditions(target, [rojo, azul])
    expect(first.role.name).toBe('Negro')
  })
  it('no sugiere una pintura base que el usuario ya tiene seleccionada', () => {
    const target = mixOf([rojo, 1], [azul, 1], [blanco, 4])
    const mine = [rojo, azul, { id: 'mi-blanco', name: 'Mi blanco', hex: '#f5f5f0' }]
    expect(suggestAdditions(target, mine).map((s) => s.role.name)).not.toContain('Blanco')
  })
  it('no sugiere pinturas que apenas mejoran: cada sugerencia acerca >= 3 de ΔE o sube de categoría', () => {
    const target = '#d9c6ef'
    const user = [{ id: 'r', name: 'Rojo', hex: '#c1121f' }, { id: 'a', name: 'Azul', hex: '#1d3fbb' }]
    const list = suggestAdditions(target, user, { maxParts: 10 })
    expect(list.length).toBeGreaterThan(0)
    for (const s of list) expect(s.improvement).toBeGreaterThanOrEqual(1)
    expect(list[0].role.name).toBe('Blanco')
    expect(list.map((s) => s.role.name)).not.toContain('Negro')
  })
  it('las sugerencias vienen de mayor a menor mejora', () => {
    const target = mixOf([rojo, 1], [azul, 1], [blanco, 4])
    const list = suggestAdditions(target, [rojo, azul])
    for (let i = 1; i < list.length; i++) expect(list[i - 1].improvement).toBeGreaterThanOrEqual(list[i].improvement)
  })
})

describe('suggestAdditions: precisión', () => {
  it('usa la cantidad máxima de partes que se le indica', () => {
    const target = mixOf([rojo, 1], [azul, 1], [blanco, 4])
    for (const maxParts of [6, 10]) {
      const [first] = suggestAdditions(target, [rojo, azul], { maxParts })
      const expected = solve({ target, paints: [rojo, azul, blanco], maxParts, maxPaints: 3 }).best.deltaE
      expect(first.role.name).toBe('Blanco')
      expect(first.deltaE).toBeCloseTo(expected)
    }
  })
  it('si ninguna pintura base mejora el resultado, no inventa sugerencias (el aviso de diagnóstico explica el problema)', () => {
    // El rojo del usuario es muy oscuro para lograr este violeta vivo: ninguna base ayuda.
    const user = [{ id: 'r', name: 'Rojo', hex: '#c1121f' }, { id: 'a', name: 'Azul', hex: '#1d3fbb' }]
    expect(suggestAdditions('#5b2a86', user, { maxParts: 10 })).toEqual([])
  })
})

describe('diagnose', () => {
  const recipeFor = (target, paints) => solve({ target, paints, maxParts: 8 }).best
  it('no avisa nada si la receta es buena', () => {
    const target = mixOf([rojo, 1], [azul, 2])
    expect(diagnose(target, recipeFor(target, [rojo, azul]))).toEqual([])
  })
  it('avisa que falta blanco si el objetivo es más claro', () => {
    const target = mixOf([rojo, 1], [blanco, 4])
    const codes = diagnose(target, recipeFor(target, [rojo, azul])).map((d) => d.code)
    expect(codes).toContain('need_white')
  })
  it('avisa que falta negro si el objetivo es más oscuro', () => {
    const target = mixOf([azul, 1], [negro, 6])
    const codes = diagnose(target, recipeFor(target, [rojo, blanco])).map((d) => d.code)
    expect(codes).toContain('need_black')
  })
  it('siempre da al menos un aviso cuando la receta queda lejos', () => {
    const target = '#2a9d8f'
    const recipe = recipeFor(target, [rojo, negro])
    expect(recipe.deltaE).toBeGreaterThanOrEqual(5)
    expect(diagnose(target, recipe).length).toBeGreaterThan(0)
  })
})
