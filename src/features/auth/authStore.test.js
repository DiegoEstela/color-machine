import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ client: {}, cb: null }))
vi.mock('../storage/supabase.js', () => ({ get supabase() { return h.client } }))
vi.mock('./authService.js', () => ({
  onAuthChange: (cb) => { h.cb = cb; return () => {} },
}))

const { useAuthStore } = await import('./authStore.js')

beforeEach(() => {
  h.client = {}
  useAuthStore.setState({ user: null, status: 'loading', recovering: false })
})

describe('authStore', () => {
  it('queda unconfigured sin cliente', () => {
    h.client = null
    useAuthStore.getState().init()
    expect(useAuthStore.getState().status).toBe('unconfigured')
  })
  it('sigue el estado de la sesión', () => {
    useAuthStore.getState().init()
    h.cb('INITIAL_SESSION', null)
    expect(useAuthStore.getState().status).toBe('signedOut')
    h.cb('SIGNED_IN', { user: { id: 'u1' } })
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedIn', user: { id: 'u1' } })
    h.cb('SIGNED_OUT', null)
    expect(useAuthStore.getState()).toMatchObject({ status: 'signedOut', user: null })
  })
  it('marca recuperación de contraseña hasta que termina', () => {
    useAuthStore.getState().init()
    h.cb('PASSWORD_RECOVERY', { user: { id: 'u1' } })
    expect(useAuthStore.getState().recovering).toBe(true)
    h.cb('TOKEN_REFRESHED', { user: { id: 'u1' } })
    expect(useAuthStore.getState().recovering).toBe(true)
    useAuthStore.getState().finishRecovery()
    expect(useAuthStore.getState().recovering).toBe(false)
  })
})
