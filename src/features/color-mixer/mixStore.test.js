import { beforeEach, describe, expect, it } from 'vitest'
import { resultKey, useMixStore } from './mixStore.js'

const s = () => useMixStore.getState()
beforeEach(() => s().reset())

describe('mixStore', () => {
  it('normaliza el color y descarta valores inválidos', () => {
    s().setTarget('ABC')
    expect(s().targetColor).toBe('#aabbcc')
    s().setTarget('nope')
    expect(s().targetColor).toBe('#aabbcc')
  })
  it('no avanza sin color objetivo', () => {
    s().next()
    expect(s().step).toBe(1)
  })
  it('avanza y vuelve conservando el color', () => {
    s().setTarget('#e63946')
    s().next()
    expect(s().step).toBe(2)
    s().back()
    expect(s()).toMatchObject({ step: 1, targetColor: '#e63946' })
  })
  it('no baja de 1 ni sube de 3', () => {
    s().back()
    expect(s().step).toBe(1)
    s().setTarget('#e63946')
    for (let i = 0; i < 6; i++) s().next()
    expect(s().step).toBe(3)
  })
  it('guarda la miniatura del objetivo y reset la limpia', () => {
    s().setTargetThumb('data:thumb')
    expect(s().targetThumb).toBe('data:thumb')
    s().setTargetThumb(null)
    expect(s().targetThumb).toBeNull()
    s().setTargetThumb('data:x')
    s().reset()
    expect(s().targetThumb).toBeNull()
  })
})

describe('mixStore: cálculo de recetas', () => {
  const rojo = { id: 'r', name: 'Rojo', hex: '#e4002b' }
  const azul = { id: 'a', name: 'Azul', hex: '#1d3fbb' }
  const wait = () => new Promise((r) => setTimeout(r, 30))

  it('calcula y guarda el resultado con su clave', async () => {
    await s().calculate({ target: '#5b2a86', paints: [rojo, azul] })
    expect(s().result.status).toBe('ready')
    expect(s().result.data.recommended.parts.length).toBeGreaterThan(0)
    expect(s().result.key).toBe(resultKey('#5b2a86', [rojo, azul], s().maxParts))
  })

  it('no recalcula si los datos son los mismos', async () => {
    await s().calculate({ target: '#5b2a86', paints: [rojo, azul] })
    const first = s().result
    await s().calculate({ target: '#5b2a86', paints: [rojo, azul] })
    expect(s().result).toBe(first)
  })

  it('cambiar el objetivo, las pinturas o la precisión invalida el resultado anterior', async () => {
    await s().calculate({ target: '#5b2a86', paints: [rojo, azul] })
    const k1 = s().result.key
    await s().calculate({ target: '#2a9d8f', paints: [rojo, azul] })
    expect(s().result.key).not.toBe(k1)
    s().setMaxParts(6)
    await s().calculate({ target: '#2a9d8f', paints: [rojo, azul] })
    expect(s().result.key).toBe(resultKey('#2a9d8f', [rojo, azul], 6))
  })

  it('descarta una respuesta vieja si los datos cambiaron mientras se calculaba', async () => {
    const slow = s().calculate({ target: '#5b2a86', paints: [rojo, azul] })
    const fast = s().calculate({ target: '#2a9d8f', paints: [rojo, azul] })
    await Promise.all([slow, fast])
    await wait()
    expect(s().result.key).toBe(resultKey('#2a9d8f', [rojo, azul], s().maxParts))
  })

  it('si las pinturas no alcanzan, guarda sugerencias', async () => {
    await s().calculate({ target: '#d8c7f0', paints: [rojo, azul] })
    await wait()
    expect(s().result.data.best.deltaE).toBeGreaterThanOrEqual(5)
    expect(s().result.suggestions.map((x) => x.role.name)).toContain('Blanco')
  })

  it('selectRecipe cambia la receta mostrada y un nuevo cálculo vuelve a la recomendada', async () => {
    s().selectRecipe('best')
    expect(s().recipeKey).toBe('best')
    await s().calculate({ target: '#5b2a86', paints: [rojo, azul] })
    expect(s().recipeKey).toBe('recommended')
  })

  it('reset limpia resultado y precisión', async () => {
    await s().calculate({ target: '#5b2a86', paints: [rojo, azul] })
    s().setMaxParts(16)
    s().reset()
    expect(s()).toMatchObject({ result: null, maxParts: 10 })
  })
})

describe('mixStore: recetas guardadas y "mezclar otra vez"', () => {
  it('recuerda qué recetas ya se guardaron y reset las olvida', () => {
    s().markSaved('firma-1', 'id-1')
    expect(s().savedRecipes).toEqual({ 'firma-1': 'id-1' })
    s().markSaved('firma-2', 'id-2')
    expect(Object.keys(s().savedRecipes)).toHaveLength(2)
    s().reset()
    expect(s().savedRecipes).toEqual({})
  })

  it('remix usa el color como objetivo, vacía el resultado y va al paso 2', () => {
    useMixStore.setState({ step: 3, targetColor: '#111111', targetThumb: 'data:x', result: { key: 'k' } })
    s().remix('#5B2A86')
    expect(s()).toMatchObject({ step: 2, targetColor: '#5b2a86', targetThumb: null, result: null, recipeKey: 'recommended' })
  })

  it('remix ignora un color inválido', () => {
    useMixStore.setState({ step: 3, targetColor: '#111111' })
    s().remix('nope')
    expect(s()).toMatchObject({ step: 3, targetColor: '#111111' })
  })
})

describe('mixStore: pinturas sumadas a la mezcla', () => {
  const blanco = { id: 'base-blanco', name: 'Blanco', hex: '#ffffff' }
  const negro = { id: 'base-negro', name: 'Negro', hex: '#141414' }

  it('addExtra suma una pintura marcada como estándar y no la repite', () => {
    s().addExtra(blanco)
    s().addExtra(blanco)
    expect(s().extraPaints).toEqual([{ ...blanco, standard: true }])
    s().addExtra(negro)
    expect(s().extraPaints.map((p) => p.id)).toEqual(['base-blanco', 'base-negro'])
  })

  it('removeExtra quita solo esa pintura', () => {
    s().addExtra(blanco)
    s().addExtra(negro)
    s().removeExtra('base-blanco')
    expect(s().extraPaints.map((p) => p.id)).toEqual(['base-negro'])
  })

  it('cambiar el color objetivo descarta las pinturas sumadas; repetir el mismo color no', () => {
    s().setTarget('#5b2a86')
    s().addExtra(blanco)
    s().setTarget('#5B2A86')
    expect(s().extraPaints).toHaveLength(1)
    s().setTarget('#2a9d8f')
    expect(s().extraPaints).toEqual([])
  })

  it('"mezclar otra vez" y reset también las descartan', () => {
    s().addExtra(blanco)
    s().remix('#5b2a86')
    expect(s().extraPaints).toEqual([])
    s().addExtra(blanco)
    s().reset()
    expect(s().extraPaints).toEqual([])
  })

  it('las pinturas sumadas cuentan en la clave: sumar una invalida el resultado anterior', () => {
    const base = [{ id: 'r', hex: '#e4002b' }, { id: 'a', hex: '#1d3fbb' }]
    expect(resultKey('#5b2a86', base, 10)).not.toBe(resultKey('#5b2a86', [...base, { id: 'base-blanco', hex: '#ffffff' }], 10))
  })

  it('la receta mostrada es solo "recomendada" o "más exacta"', () => {
    s().selectRecipe('best')
    expect(s().recipeKey).toBe('best')
    s().reset()
    expect(s().recipeKey).toBe('recommended')
  })
})

