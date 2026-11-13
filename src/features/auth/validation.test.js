import { describe, expect, it } from 'vitest'
import { validateForm, validateEmail, validatePassword } from './validation.js'

describe('validation', () => {
  it('valida email', () => {
    expect(validateEmail('a@b.co')).toBeNull()
    expect(validateEmail('a@b')).not.toBeNull()
    expect(validateEmail('')).not.toBeNull()
  })
  it('exige 8 caracteres de contraseña', () => {
    expect(validatePassword('1234567')).not.toBeNull()
    expect(validatePassword('12345678')).toBeNull()
  })
  it('login solo pide email válido y contraseña no vacía', () => {
    expect(validateForm('login', { email: 'a@b.co', password: 'x' })).toEqual({})
    expect(Object.keys(validateForm('login', { email: 'x', password: '' }))).toEqual(['email', 'password'])
  })
  it('signup exige que las contraseñas coincidan', () => {
    const base = { email: 'a@b.co', password: '12345678' }
    expect(validateForm('signup', { ...base, confirm: '12345678' })).toEqual({})
    expect(validateForm('signup', { ...base, confirm: 'otra' }).confirm).toBeDefined()
  })
  it('forgot solo pide email; reset no pide email', () => {
    expect(validateForm('forgot', { email: 'a@b.co' })).toEqual({})
    expect(validateForm('reset', { password: '12345678', confirm: '12345678' })).toEqual({})
  })
})
