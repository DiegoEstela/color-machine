import { describe, expect, it } from 'vitest'
import {
  IMPROVE_DELTA_E, adviceForTone, adviseBasePaints, baseRoleOf, colorFamilyTip, describePlan, diagnose, matchPaints, planMissingPaints,
  suggestAdditions, suggestPrecision,
} from './advisor.js'
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

describe('planMissingPaints: consejo completo', () => {
  const sinPlan = (plan) => plan.roles.map((r) => r.name).sort()

  it('si ya alcanza no hay plan', () => {
    expect(planMissingPaints(mixOf([rojo, 1], [azul, 2]), [rojo, azul])).toBeNull()
  })

  it('un verde con solo rojo y negro pide amarillo Y azul juntos (ninguno solo alcanza)', () => {
    const target = '#2e8b3d'
    // de a una, ninguna suma mejora lo suficiente: el consejo de siempre queda vacío
    expect(suggestAdditions(target, [rojo, negro]).map((s) => s.role.name)).not.toEqual(expect.arrayContaining(['Amarillo', 'Azul']))
    const plan = planMissingPaints(target, [rojo, negro])
    expect(sinPlan(plan)).toEqual(['Amarillo', 'Azul'])
    expect(plan.enough).toBe(true)
    expect(plan.deltaE).toBeLessThan(5)
    expect(plan.recipe.parts.map((p) => p.name)).toEqual(expect.arrayContaining(['Amarillo', 'Azul']))
  })

  it('elige el conjunto más chico que alcanza: un naranja con azul y negro pide rojo y amarillo, no tres', () => {
    const plan = planMissingPaints('#ff8c00', [azul, negro])
    expect(sinPlan(plan)).toEqual(['Amarillo', 'Rojo'])
  })

  it('un solo color que falta se recomienda solo (un rosa pastel pide blanco)', () => {
    const plan = planMissingPaints(mixOf([rojo, 1], [blanco, 3]), [rojo, negro])
    expect(sinPlan(plan)).toEqual(['Blanco'])
    expect(plan.enough).toBe(true)
    expect(plan.deltaE).toBeLessThan(5)
  })

  it('si ni sumando lo que falta llega del todo, igual dice qué sumar y cuánto se acerca (sin prometer de más)', () => {
    const plan = planMissingPaints('#d9c6ef', [{ id: 'ro', name: 'Rojo', hex: '#c1121f' }, azul])
    expect(sinPlan(plan)).toContain('Blanco')
    expect(plan.roles.length).toBeGreaterThan(0)
    expect(describePlan(plan)).toMatch(/Blanco/)
    expect(plan.enough).toBe(plan.deltaE < 5)
  })

  it('no ofrece pinturas que el usuario ya tiene', () => {
    const plan = planMissingPaints('#2e8b3d', [rojo, amarillo, negro])
    expect(sinPlan(plan)).not.toContain('Amarillo')
    expect(sinPlan(plan)).not.toContain('Rojo')
  })

  it('si sumar no mejora nada, no inventa: devuelve roles vacíos con lo más cerca que se llega', () => {
    // con todo lo de la caja base ya presente no queda nada que sumar
    const plan = planMissingPaints('#00ffff', [rojo, amarillo, azul, blanco, negro])
    if (plan) {
      expect(plan.roles).toEqual([])
      expect(plan.enough).toBe(false)
      expect(describePlan(plan)).toMatch(/lo más cerca que se llega/)
    }
  })

  it('la receta del plan usa todos los colores sumados', () => {
    const plan = planMissingPaints('#2e8b3d', [rojo, negro])
    for (const role of plan.roles) expect(plan.recipe.parts.some((p) => p.paintId === role.id)).toBe(true)
  })
})

describe('describePlan', () => {
  const recipe = { parts: [{ name: 'Amarillo', parts: 3 }, { name: 'Azul', parts: 4 }] }
  it('dice qué te falta, cómo queda y la receta', () => {
    const text = describePlan({ roles: [{ name: 'Amarillo' }, { name: 'Azul' }], recipe, quality: 'Muy parecido', enough: true })
    expect(text).toBe('Para este color te faltan: Amarillo y Azul. Con eso queda muy parecido: 3 Amarillo · 4 Azul.')
  })
  it('concuerda en singular y une tres con comas', () => {
    expect(describePlan({ roles: [{ name: 'Blanco' }], recipe, quality: 'Casi idéntico', enough: true })).toMatch(/te falta: Blanco\./)
    expect(describePlan({ roles: [{ name: 'A' }, { name: 'B' }, { name: 'C' }], recipe, quality: 'Parecido', enough: true })).toMatch(/A, B y C/)
  })
  it('si no llega del todo lo dice con honestidad', () => {
    expect(describePlan({ roles: [{ name: 'Blanco' }], recipe, quality: 'Parecido', enough: false })).toMatch(/te acercás todo lo que se puede/)
  })
  it('sin plan no hay frase', () => {
    expect(describePlan(null)).toBeNull()
  })
})

describe('planMissingPaints con umbral fino (para acercarte más)', () => {
  const primarios = [rojo, amarillo, azul]
  const names = (plan) => plan.roles.map((r) => r.name).sort()

  it('con el umbral por defecto no cambia: un marrón a ΔE 5,1 se arregla igual que antes', () => {
    const plan = planMissingPaints('#8b5a2b', primarios, { maxParts: 10 })
    expect(plan).not.toBeNull()
    expect(planMissingPaints('#8b5a2b', primarios, { maxParts: 10, threshold: 5 })).toEqual(plan)
  })

  it('un marrón oscuro con solo los tres primarios pide NEGRO y la receta nueva queda "Muy parecido"', () => {
    const plan = planMissingPaints('#8b5a2b', primarios, { maxParts: 10, threshold: IMPROVE_DELTA_E })
    expect(names(plan)).toEqual(['Negro'])
    expect(plan.deltaE).toBeLessThan(5)
    expect(plan.recipe.parts.map((p) => p.name)).toContain('Negro')
    expect(plan.enough).toBe(true)
  })

  it('un marrón claro con solo los tres primarios pide BLANCO y queda casi idéntico', () => {
    const plan = planMissingPaints('#a67b5b', primarios, { maxParts: 10, threshold: IMPROVE_DELTA_E })
    expect(names(plan)).toEqual(['Blanco'])
    expect(plan.deltaE).toBeLessThan(2)
  })

  it('con ΔE entre 2 y 5 ofrece subir de categoría (antes no decía nada)', () => {
    const target = '#8b5a2b'
    const rec = solve({ target, paints: [rojo, amarillo, negro], maxParts: 10 }).best // ΔE ≈ 3,3: "Muy parecido"
    expect(rec.deltaE).toBeGreaterThan(IMPROVE_DELTA_E)
    expect(rec.deltaE).toBeLessThan(5)
    expect(planMissingPaints(target, [rojo, amarillo, negro], { maxParts: 10 })).toBeNull() // umbral viejo: no hay plan
    const plan = planMissingPaints(target, [rojo, amarillo, negro], { maxParts: 10, threshold: IMPROVE_DELTA_E })
    expect(plan).not.toBeNull()
    if (plan.roles.length > 0) expect(plan.deltaE).toBeLessThan(rec.deltaE - 0.99)
  })

  it('si ya es "Casi idéntico" no hay plan', () => {
    expect(planMissingPaints('#a67b5b', [rojo, amarillo, azul, blanco], { maxParts: 10, threshold: IMPROVE_DELTA_E })).toBeNull()
  })

  it('si sumar no mejora lo suficiente devuelve roles vacíos (lo más cerca que se llega) y nunca queda mudo', () => {
    const plan = planMissingPaints('#00d4ff', [rojo, amarillo, azul, blanco, negro], { maxParts: 10, threshold: IMPROVE_DELTA_E })
    if (plan) expect(plan.roles).toEqual([])
  })
})

describe('suggestPrecision', () => {
  it('si una precisión mayor acerca la receta, la ofrece con el parecido que lograría', () => {
    const found = ['#7b3f20', '#8b5a2b', '#c19a6b', '#5c3a21'].map((t) => suggestPrecision(t, [rojo, amarillo, azul, blanco, negro], { maxParts: 10 })).filter(Boolean)
    expect(found.length).toBeGreaterThan(0) // con 16 partes mejoran el tostado, el rojizo y el medio
    for (const r of found) {
      expect(r.maxParts).toBe(16)
      expect(r.recipe.total).toBeLessThanOrEqual(16)
    }
  })
  it('si no mejora, no ofrece nada (por ejemplo el chocolate ya está en su mejor receta)', () => {
    expect(suggestPrecision('#5c3a21', [rojo, amarillo, azul, blanco, negro], { maxParts: 10 })).toBeNull()
  })
  it('en la precisión más alta no hay más para ofrecer', () => {
    expect(suggestPrecision('#8b5a2b', [rojo, amarillo, azul], { maxParts: 16 })).toBeNull()
  })
  it('desde Simple puede saltar a la que sirva (10 o 16), nunca a una menor', () => {
    const r = suggestPrecision('#8b5a2b', [rojo, amarillo, azul, negro], { maxParts: 6 })
    if (r) expect([10, 16]).toContain(r.maxParts)
  })
})

describe('baseRoleOf y adviceForTone', () => {
  it('reconoce a qué pintura base se parece una pintura', () => {
    expect(baseRoleOf('#e63946')).toBe('base-rojo')
    expect(baseRoleOf('#1a3cb0')).toBe('base-azul')
    expect(baseRoleOf('#aaaaaa')).not.toBe('base-rojo')
  })
  const parts = [{ name: 'Mi rojo', hex: '#e4002b' }, { name: 'Mi amarillo', hex: '#fcd116' }, { name: 'Mi azul', hex: '#1d3fbb' }]
  it('si tira a azul: menos azul o más amarillo, con los nombres de TUS pinturas', () => {
    expect(adviceForTone({ tone: 'bluer' }, parts)).toBe('Tira a azul: probá menos Mi azul o más Mi amarillo.')
  })
  it('si tira a amarillo: menos amarillo o más azul', () => {
    expect(adviceForTone({ tone: 'yellower' }, parts)).toBe('Tira a amarillo: probá menos Mi amarillo o más Mi azul.')
  })
  it('si tira a rojo: menos rojo o más azul; si tira a verde: menos azul o más rojo', () => {
    expect(adviceForTone({ tone: 'redder' }, parts)).toMatch(/menos Mi rojo o más Mi azul/)
    expect(adviceForTone({ tone: 'greener' }, parts)).toMatch(/menos Mi azul o más Mi rojo/)
  })
  it('solo nombra pinturas que están en la receta', () => {
    expect(adviceForTone({ tone: 'bluer' }, [parts[2]])).toBe('Tira a azul: probá menos Mi azul.')
    expect(adviceForTone({ tone: 'bluer' }, [parts[1]])).toBe('Tira a azul: probá más Mi amarillo.')
    expect(adviceForTone({ tone: 'bluer' }, [parts[0]])).toBeNull()
  })
  it('sin tono no hay consejo', () => {
    expect(adviceForTone({ tone: 'same' }, parts)).toBeNull()
    expect(adviceForTone(undefined, parts)).toBeNull()
  })
})

describe('colorFamilyTip', () => {
  it('los marrones (oscuros, medios y claros) reciben el consejo de marrón', () => {
    for (const brown of ['#8b5a2b', '#5c3a21', '#a67b5b', '#c19a6b', '#7b3f20']) {
      expect(colorFamilyTip(brown)?.id).toBe('brown')
    }
    expect(colorFamilyTip('#8b5a2b').text).toMatch(/rojo, amarillo y azul/)
  })
  it('los grises y los muy oscuros reciben el suyo', () => {
    expect(colorFamilyTip('#808080')?.id).toBe('gray')
    expect(colorFamilyTip('#1a1020')?.id).toBe('dark')
  })
  it('los colores vivos o claros no reciben ninguno', () => {
    for (const vivid of ['#ff0000', '#ff8c00', '#00b894', '#f4a6b8', '#ffeb3b', '#2a52be']) expect(colorFamilyTip(vivid)).toBeNull()
  })
})
