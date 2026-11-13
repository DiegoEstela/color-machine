import { afterEach, describe, expect, it, vi } from 'vitest'
import { OFFLINE_MESSAGE, isNetworkError, offlineError } from './errors.js'

afterEach(() => vi.restoreAllMocks())

describe('isNetworkError', () => {
  it.each([
    'TypeError: Failed to fetch',
    'NetworkError when attempting to fetch resource.',
    'Network request failed',
    'Load failed',
    'net::ERR_INTERNET_DISCONNECTED',
  ])('reconoce "%s"', (message) => expect(isNetworkError({ message })).toBe(true))

  it('reconoce el error de reintento de red de Supabase Auth', () => {
    expect(isNetworkError({ name: 'AuthRetryableFetchError', message: 'x' })).toBe(true)
  })
  it('no confunde errores de la base o de credenciales con la red', () => {
    expect(isNetworkError({ message: 'new row violates check constraint', code: '23514' })).toBe(false)
    expect(isNetworkError({ message: 'Invalid login credentials', code: 'invalid_credentials' })).toBe(false)
  })
  it('sin error no hay error de red', () => {
    expect(isNetworkError(null)).toBe(false)
    expect(isNetworkError(undefined)).toBe(false)
  })
  it('sin conexión (navigator.onLine = false) cualquier error se trata como de red', () => {
    vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    expect(isNetworkError({ message: 'lo que sea' })).toBe(true)
  })
})

describe('offlineError', () => {
  it('devuelve un mensaje claro en español', () => {
    expect(offlineError()).toEqual({ code: 'offline', message: OFFLINE_MESSAGE })
    expect(OFFLINE_MESSAGE).toMatch(/^Sin conexión/)
  })
})
