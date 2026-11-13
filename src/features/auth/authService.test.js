import { beforeEach, describe, expect, it, vi } from 'vitest'

const h = vi.hoisted(() => ({ client: null }))
vi.mock('../storage/supabase.js', () => ({
  get supabase() { return h.client },
}))

const svc = await import('./authService.js')

const makeClient = (overrides = {}) => ({
  auth: {
    signUp: vi.fn().mockResolvedValue({ data: { user: { identities: [{}] }, session: null }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { session: {} }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    ...overrides,
  },
})

beforeEach(() => { h.client = makeClient() })

describe('authService', () => {
  it('signUp pide confirmación cuando no hay sesión y recorta el email', async () => {
    const res = await svc.signUp('  a@b.co ', '12345678')
    expect(res).toEqual({ data: { needsConfirmation: true }, error: null })
    expect(h.client.auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.co', password: '12345678' }),
    )
  })
  it('signUp detecta email ya registrado (identities vacío)', async () => {
    h.client = makeClient({ signUp: vi.fn().mockResolvedValue({ data: { user: { identities: [] }, session: null }, error: null }) })
    const res = await svc.signUp('a@b.co', '12345678')
    expect(res.error.code).toBe('user_already_exists')
  })
  it('traduce errores de credenciales sin exponer detalles técnicos', async () => {
    h.client = makeClient({ signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: { code: 'invalid_credentials', message: 'Invalid login credentials' } }) })
    const res = await svc.signIn('a@b.co', 'mala')
    expect(res.error.message).toBe('Email o contraseña incorrectos.')
  })
  it('usa un mensaje genérico para errores desconocidos', async () => {
    h.client = makeClient({ updateUser: vi.fn().mockResolvedValue({ data: null, error: { code: 'raro', message: 'stack interno' } }) })
    const res = await svc.updatePassword('12345678')
    expect(res.error.message).not.toContain('stack')
  })
  it('sin cliente devuelve not_configured', async () => {
    h.client = null
    expect((await svc.signIn('a@b.co', 'x')).error.code).toBe('not_configured')
    expect(svc.onAuthChange(() => {})).toBeTypeOf('function')
  })
  it('onAuthChange devuelve la función para cancelar la suscripción', () => {
    const off = svc.onAuthChange(() => {})
    off()
    expect(h.client.auth.onAuthStateChange).toHaveBeenCalled()
  })
})
