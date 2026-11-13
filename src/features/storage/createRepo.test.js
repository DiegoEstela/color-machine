import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ user: { id: 'u1' }, calls: [], result: { data: [], error: null } }))

vi.mock('./supabase.js', () => {
  // Cliente falso encadenable: registra las llamadas y resuelve con state.result.
  const chain = () =>
    new Proxy(() => {}, {
      get: (_, prop) => {
        if (prop === 'then') return (res) => res(state.result)
        return (...args) => { state.calls.push([prop, ...args]); return chain() }
      },
    })
  return {
    supabase: { from: (table) => { state.calls.push(['from', table]); return chain() } },
    requireUser: async () =>
      state.user
        ? { user: state.user, error: null }
        : { user: null, error: { code: 'not_signed_in', message: 'Necesitás iniciar sesión.' } },
  }
})

const { createRepo } = await import('./createRepo.js')

beforeEach(() => {
  state.user = { id: 'u1' }
  state.calls = []
  state.result = { data: [{ id: 1 }], error: null }
})

describe('createRepo', () => {
  it('list consulta la tabla ordenada por fecha desc', async () => {
    const { data, error } = await createRepo('paints').list()
    expect(error).toBeNull()
    expect(data).toEqual([{ id: 1 }])
    expect(state.calls).toContainEqual(['from', 'paints'])
    expect(state.calls).toContainEqual(['order', 'created_at', { ascending: false }])
  })

  it('create descarta id, owner_id y created_at', async () => {
    await createRepo('paints').create({ id: 'x', owner_id: 'hack', created_at: 'y', name: 'rojo', hex: '#E63946' })
    expect(state.calls).toContainEqual(['insert', { name: 'rojo', hex: '#E63946' }])
  })

  it('update filtra por id', async () => {
    await createRepo('recipes').update('abc', { name: 'Violeta' })
    expect(state.calls).toContainEqual(['update', { name: 'Violeta' }])
    expect(state.calls).toContainEqual(['eq', 'id', 'abc'])
  })

  it('remove borra por id', async () => {
    await createRepo('recipes').remove('abc')
    expect(state.calls).toContainEqual(['delete'])
    expect(state.calls).toContainEqual(['eq', 'id', 'abc'])
  })

  it('sin sesión devuelve error y no toca la base', async () => {
    state.user = null
    const res = await createRepo('paints').list()
    expect(res.data).toBeNull()
    expect(res.error.code).toBe('not_signed_in')
    expect(state.calls).toHaveLength(0)
  })

  it('un fallo de red devuelve un mensaje claro de "sin conexión"', async () => {
    state.result = { data: null, error: { message: 'TypeError: Failed to fetch' } }
    const res = await createRepo('paints').list()
    expect(res.data).toBeNull()
    expect(res.error.code).toBe('offline')
    expect(res.error.message).toMatch(/^Sin conexión/)
  })

  it('normaliza errores de la base', async () => {
    state.result = { data: null, error: { code: '23514', message: 'check violation', details: 'x' } }
    const res = await createRepo('paints').create({ name: '', hex: 'zz' })
    expect(res).toEqual({ data: null, error: { code: '23514', message: 'check violation' } })
  })
})
