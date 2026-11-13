import { beforeEach, describe, expect, it, vi } from 'vitest'

const repo = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('../storage/paintsRepo.js', () => ({ paintsRepo: repo }))

const { usePaintsStore, MAX_SELECTED } = await import('./paintsStore.js')
const s = () => usePaintsStore.getState()
const paint = (id, name = id, hex = '#ff0000') => ({ id, name, hex })

beforeEach(() => {
  s().reset()
  Object.values(repo).forEach((fn) => fn.mockReset())
})

describe('paintsStore', () => {
  it('load guarda las pinturas y descarta selecciones que ya no existen', async () => {
    usePaintsStore.setState({ selectedIds: ['a', 'zzz'] })
    repo.list.mockResolvedValue({ data: [paint('a'), paint('b')], error: null })
    await s().load()
    expect(s()).toMatchObject({ status: 'ready', selectedIds: ['a'] })
    expect(s().paints).toHaveLength(2)
  })

  it('load muestra el error', async () => {
    repo.list.mockResolvedValue({ data: null, error: { message: 'sin conexión' } })
    await s().load()
    expect(s()).toMatchObject({ status: 'error', error: 'sin conexión' })
  })

  it('add agrega al principio y recuerda la miniatura', async () => {
    usePaintsStore.setState({ paints: [paint('a')] })
    repo.create.mockResolvedValue({ data: paint('b', 'Azul', '#0000ff'), error: null })
    const res = await s().add({ name: 'Azul', hex: '#0000ff' }, 'data:thumb')
    expect(res.data.id).toBe('b')
    expect(repo.create).toHaveBeenCalledWith({ name: 'Azul', hex: '#0000ff' })
    expect(s().paints.map((p) => p.id)).toEqual(['b', 'a'])
    expect(s().thumbs.b).toBe('data:thumb')
  })

  it('add devuelve el error y no cambia la lista', async () => {
    repo.create.mockResolvedValue({ data: null, error: { message: 'falló' } })
    expect(await s().add({ name: 'x', hex: '#000000' })).toEqual({ error: 'falló' })
    expect(s().paints).toHaveLength(0)
  })

  it('update reemplaza la pintura y descarta su miniatura', async () => {
    usePaintsStore.setState({ paints: [paint('a')], thumbs: { a: 'data:thumb' } })
    repo.update.mockResolvedValue({ data: paint('a', 'Rojo 2', '#aa0000'), error: null })
    await s().update('a', { name: 'Rojo 2', hex: '#aa0000' })
    expect(s().paints[0].name).toBe('Rojo 2')
    expect(s().thumbs.a).toBeUndefined()
  })

  it('remove quita la pintura, su selección y su miniatura', async () => {
    usePaintsStore.setState({ paints: [paint('a'), paint('b')], selectedIds: ['a', 'b'], thumbs: { a: 'x' } })
    repo.remove.mockResolvedValue({ data: null, error: null })
    await s().remove('a')
    expect(s().paints.map((p) => p.id)).toEqual(['b'])
    expect(s().selectedIds).toEqual(['b'])
    expect(s().thumbs).toEqual({})
  })

  it('remove con error no toca el estado', async () => {
    usePaintsStore.setState({ paints: [paint('a')] })
    repo.remove.mockResolvedValue({ data: null, error: { message: 'no se pudo' } })
    expect(await s().remove('a')).toEqual({ error: 'no se pudo' })
    expect(s().paints).toHaveLength(1)
  })

  it('toggleSelect marca, desmarca y respeta el máximo', () => {
    for (let i = 0; i < MAX_SELECTED; i++) expect(s().toggleSelect(`p${i}`)).toBe(true)
    expect(s().toggleSelect('extra')).toBe(false)
    expect(s().selectedIds).toHaveLength(MAX_SELECTED)
    expect(s().toggleSelect('p0')).toBe(true)
    expect(s().selectedIds).not.toContain('p0')
  })
})

describe('paintsStore: nombre sugerido', () => {
  it('guarda y limpia el nombre pendiente; reset también lo limpia', () => {
    s().setPendingName('Blanco')
    expect(s().pendingName).toBe('Blanco')
    s().setPendingName(null)
    expect(s().pendingName).toBeNull()
    s().setPendingName('Azul')
    s().reset()
    expect(s().pendingName).toBeNull()
  })
})
