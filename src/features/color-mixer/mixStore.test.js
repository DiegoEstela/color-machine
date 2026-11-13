import { beforeEach, describe, expect, it } from 'vitest'
import { useMixStore } from './mixStore.js'

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
