import { describe, expect, it } from 'vitest'
import { buildRecipePayload, recipeSignature, summarizeMix, totalParts, validateRecipeName } from './validation.js'

const recipe = {
  mixHex: '#583087',
  parts: [
    { paintId: 'r', name: 'Rojo', hex: '#E4002B', parts: 2 },
    { paintId: 'a', name: 'Azul', hex: '#1d3fbb', parts: 1 },
  ],
}

describe('validateRecipeName', () => {
  it('acepta un nombre y le quita los espacios de los bordes', () => {
    expect(validateRecipeName('  Violeta suave ')).toEqual({ error: null, value: 'Violeta suave' })
  })
  it('rechaza vacío o solo espacios', () => {
    expect(validateRecipeName('').error).toBeTruthy()
    expect(validateRecipeName('    ').error).toBeTruthy()
    expect(validateRecipeName(undefined).error).toBeTruthy()
  })
  it('acepta justo 60 caracteres y rechaza 61', () => {
    expect(validateRecipeName('a'.repeat(60)).error).toBeNull()
    expect(validateRecipeName('a'.repeat(61)).error).toMatch(/60/)
  })
})

describe('buildRecipePayload', () => {
  it('arma el contenido de la tabla con nombre, colores y una copia de las partes', () => {
    const { payload, error } = buildRecipePayload({ name: ' Mi violeta ', targetHex: '5B2A86', recipe })
    expect(error).toBeUndefined()
    expect(payload).toEqual({
      name: 'Mi violeta',
      target_hex: '#5b2a86',
      result_hex: '#583087',
      mix: [
        { name: 'Rojo', hex: '#e4002b', parts: 2 },
        { name: 'Azul', hex: '#1d3fbb', parts: 1 },
      ],
    })
  })
  it('no incluye el id del dueño ni la fecha (los pone la base)', () => {
    const { payload } = buildRecipePayload({ name: 'x', targetHex: '#5b2a86', recipe })
    expect(Object.keys(payload).sort()).toEqual(['mix', 'name', 'result_hex', 'target_hex'])
  })
  it('rechaza un nombre inválido', () => {
    expect(buildRecipePayload({ name: '', targetHex: '#5b2a86', recipe }).error).toMatch(/nombre/)
  })
  it('rechaza colores inválidos, partes no enteras y mezclas vacías o demasiado largas', () => {
    expect(buildRecipePayload({ name: 'x', targetHex: 'nope', recipe }).error).toBeTruthy()
    expect(buildRecipePayload({ name: 'x', targetHex: '#5b2a86', recipe: { ...recipe, mixHex: 'zz' } }).error).toBeTruthy()
    expect(buildRecipePayload({ name: 'x', targetHex: '#5b2a86', recipe: { ...recipe, parts: [{ name: 'R', hex: '#fff', parts: 1.5 }] } }).error).toBeTruthy()
    expect(buildRecipePayload({ name: 'x', targetHex: '#5b2a86', recipe: { ...recipe, parts: [] } }).error).toBeTruthy()
    const many = Array.from({ length: 13 }, (_, i) => ({ name: `p${i}`, hex: '#ffffff', parts: 1 }))
    expect(buildRecipePayload({ name: 'x', targetHex: '#5b2a86', recipe: { ...recipe, parts: many } }).error).toBeTruthy()
  })
})

describe('resumen y firma', () => {
  it('resume las partes y las suma', () => {
    const mix = [{ name: 'Rojo', hex: '#e4002b', parts: 2 }, { name: 'Azul', hex: '#1d3fbb', parts: 1 }]
    expect(summarizeMix(mix)).toBe('2 Rojo · 1 Azul')
    expect(totalParts(mix)).toBe(3)
    expect(summarizeMix()).toBe('')
  })
  it('la firma distingue objetivo y partes, y no cambia entre mayúsculas del hex del objetivo', () => {
    const a = recipeSignature('#5B2A86', recipe)
    expect(a).toBe(recipeSignature('#5b2a86', recipe))
    expect(a).not.toBe(recipeSignature('#5b2a87', recipe))
    const other = { ...recipe, parts: [{ ...recipe.parts[0], parts: 3 }, recipe.parts[1]] }
    expect(a).not.toBe(recipeSignature('#5b2a86', other))
  })
})
