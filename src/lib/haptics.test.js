import { afterEach, describe, expect, it, vi } from 'vitest'
import { tap } from './haptics.js'

afterEach(() => { delete navigator.vibrate })

describe('tap', () => {
  it('vibra poco si el dispositivo puede', () => {
    navigator.vibrate = vi.fn()
    tap()
    expect(navigator.vibrate).toHaveBeenCalledWith(8)
  })
  it('no falla si no existe navigator.vibrate', () => {
    expect(() => tap()).not.toThrow()
  })
  it('no falla si vibrate lanza un error', () => {
    navigator.vibrate = () => { throw new Error('no permitido') }
    expect(() => tap()).not.toThrow()
  })
})
