import { describe, expect, it } from 'vitest'
import { formatRecipeDate } from './format.js'

describe('formatRecipeDate', () => {
  it('da día, mes corto y año en español', () => {
    expect(formatRecipeDate('2026-11-14T12:00:00Z')).toMatch(/^\d{1,2} nov 2026$/)
  })
  it('no deja puntos en el mes abreviado', () => {
    expect(formatRecipeDate('2026-09-10T12:00:00Z')).not.toMatch(/\./)
  })
  it('devuelve vacío si la fecha no es válida', () => {
    expect(formatRecipeDate('nope')).toBe('')
    expect(formatRecipeDate(undefined)).toBe('')
  })
})
