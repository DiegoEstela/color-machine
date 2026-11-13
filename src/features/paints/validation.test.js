import { describe, expect, it } from 'vitest'
import { validatePaint } from './validation.js'

describe('validatePaint', () => {
  it('acepta y normaliza', () => {
    expect(validatePaint({ name: '  Rojo ', hex: 'E63946' })).toEqual({
      errors: {}, values: { name: 'Rojo', hex: '#e63946' },
    })
  })
  it('rechaza nombre vacío o solo espacios', () => {
    expect(validatePaint({ name: '   ', hex: '#fff' }).errors.name).toBeDefined()
  })
  it('rechaza nombre de más de 40 caracteres y acepta justo 40', () => {
    expect(validatePaint({ name: 'a'.repeat(41), hex: '#fff' }).errors.name).toBeDefined()
    expect(validatePaint({ name: 'a'.repeat(40), hex: '#fff' }).errors.name).toBeUndefined()
  })
  it('rechaza hex inválido', () => {
    const { errors, values } = validatePaint({ name: 'Rojo', hex: '#zzz' })
    expect(errors.hex).toBeDefined()
    expect(values).toBeNull()
  })
})
