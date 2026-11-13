import { beforeEach, describe, expect, it, vi } from 'vitest'

const repo = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('../storage/recipesRepo.js', () => ({ recipesRepo: repo }))

const { useRecipesStore } = await import('./recipesStore.js')
const s = () => useRecipesStore.getState()
const recipe = (id, name = id) => ({ id, name, target_hex: '#5b2a86', result_hex: '#583087', mix: [{ name: 'Rojo', hex: '#e4002b', parts: 1 }], created_at: '2026-11-14T10:00:00Z' })

beforeEach(() => {
  s().reset()
  Object.values(repo).forEach((fn) => fn.mockReset())
})

describe('recipesStore', () => {
  it('load guarda las recetas y pasa a ready', async () => {
    repo.list.mockResolvedValue({ data: [recipe('a'), recipe('b')], error: null })
    await s().load()
    expect(s()).toMatchObject({ status: 'ready', error: null })
    expect(s().recipes.map((r) => r.id)).toEqual(['a', 'b'])
  })
  it('load muestra el error', async () => {
    repo.list.mockResolvedValue({ data: null, error: { message: 'Sin conexión' } })
    await s().load()
    expect(s()).toMatchObject({ status: 'error', error: 'Sin conexión' })
  })
  it('add agrega la nueva al principio', async () => {
    useRecipesStore.setState({ recipes: [recipe('a')] })
    repo.create.mockResolvedValue({ data: recipe('b'), error: null })
    const res = await s().add({ name: 'b' })
    expect(res.data.id).toBe('b')
    expect(s().recipes.map((r) => r.id)).toEqual(['b', 'a'])
  })
  it('add con error devuelve el mensaje y no cambia la lista', async () => {
    repo.create.mockResolvedValue({ data: null, error: { message: 'No se pudo' } })
    expect(await s().add({ name: 'x' })).toEqual({ error: 'No se pudo' })
    expect(s().recipes).toHaveLength(0)
  })
  it('rename reemplaza la receta y solo cambia el nombre en la base', async () => {
    useRecipesStore.setState({ recipes: [recipe('a', 'Viejo')] })
    repo.update.mockResolvedValue({ data: recipe('a', 'Nuevo'), error: null })
    await s().rename('a', 'Nuevo')
    expect(repo.update).toHaveBeenCalledWith('a', { name: 'Nuevo' })
    expect(s().recipes[0].name).toBe('Nuevo')
  })
  it('remove quita la receta; con error no la toca', async () => {
    useRecipesStore.setState({ recipes: [recipe('a'), recipe('b')] })
    repo.remove.mockResolvedValue({ data: null, error: { message: 'Falló' } })
    expect(await s().remove('a')).toEqual({ error: 'Falló' })
    expect(s().recipes).toHaveLength(2)
    repo.remove.mockResolvedValue({ data: null, error: null })
    await s().remove('a')
    expect(s().recipes.map((r) => r.id)).toEqual(['b'])
  })
  it('reset vacía todo', () => {
    useRecipesStore.setState({ recipes: [recipe('a')], status: 'ready' })
    s().reset()
    expect(s()).toMatchObject({ recipes: [], status: 'idle', error: null })
  })
})
