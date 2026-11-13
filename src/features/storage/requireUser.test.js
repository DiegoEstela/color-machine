import { afterEach, describe, expect, it, vi } from 'vitest'

afterEach(() => { vi.unstubAllEnvs(); vi.resetModules() })

describe('requireUser', () => {
  it('sin variables de entorno devuelve not_configured', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '')
    vi.resetModules()
    const { supabase, requireUser } = await import('./supabase.js')
    expect(supabase).toBeNull()
    const { user, error } = await requireUser()
    expect(user).toBeNull()
    expect(error.code).toBe('not_configured')
  })

  it('sin sesión devuelve not_signed_in', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
    vi.resetModules()
    const { supabase, requireUser } = await import('./supabase.js')
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: null }, error: null })
    const { error } = await requireUser()
    expect(error.code).toBe('not_signed_in')
  })

  it('con sesión devuelve el usuario', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
    vi.resetModules()
    const { supabase, requireUser } = await import('./supabase.js')
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: { user: { id: 'u1' } } }, error: null })
    const { user, error } = await requireUser()
    expect(error).toBeNull()
    expect(user.id).toBe('u1')
  })

  it('si la sesión falla por falta de red devuelve "sin conexión"', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key')
    vi.resetModules()
    const { supabase, requireUser } = await import('./supabase.js')
    vi.spyOn(supabase.auth, 'getSession').mockResolvedValue({ data: { session: null }, error: { name: 'AuthRetryableFetchError', message: 'Failed to fetch' } })
    const { error } = await requireUser()
    expect(error.code).toBe('offline')
  })
})
