import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ROUTES, navigate, parseRoute, tabFor, useRoute } from './useRoute.js'

afterEach(() => { window.location.hash = '' })

describe('parseRoute', () => {
  it.each([
    ['', { name: 'create' }],
    ['#', { name: 'create' }],
    ['#/', { name: 'create' }],
    ['#/recetas', { name: 'library' }],
    ['#/recetas/', { name: 'library' }],
    ['#/recetas/abc-123', { name: 'recipe', id: 'abc-123' }],
    ['#/cuenta', { name: 'account' }],
    ['#/pinturas', { name: 'paints' }],
    ['#/recetas/abc-123/editar', { name: 'recipe-edit', id: 'abc-123' }],
    ['#/recetas/a%20b/editar/', { name: 'recipe-edit', id: 'a b' }],
    ['#/cualquier-cosa', { name: 'create' }],
  ])('%s → %o', (hash, route) => expect(parseRoute(hash)).toEqual(route))

  it('decodifica el id de la receta', () => {
    expect(parseRoute('#/recetas/a%20b')).toEqual({ name: 'recipe', id: 'a b' })
  })
})

describe('ROUTES y tabFor', () => {
  it('las rutas se reconocen entre sí', () => {
    expect(parseRoute(ROUTES.create).name).toBe('create')
    expect(parseRoute(ROUTES.library).name).toBe('library')
    expect(parseRoute(ROUTES.account).name).toBe('account')
    expect(parseRoute(ROUTES.paints).name).toBe('paints')
    expect(parseRoute(ROUTES.recipeEdit('x y'))).toEqual({ name: 'recipe-edit', id: 'x y' })
    expect(parseRoute(ROUTES.recipe('x y'))).toEqual({ name: 'recipe', id: 'x y' })
  })
  it('el detalle de una receta marca la pestaña Recetas', () => {
    expect(tabFor({ name: 'recipe', id: 'a' })).toBe('library')
    expect(tabFor({ name: 'create' })).toBe('create')
    expect(tabFor({ name: 'account' })).toBe('account')
    expect(tabFor({ name: 'paints' })).toBeNull()
    expect(tabFor({ name: 'recipe-edit', id: 'a' })).toBe('library')
  })
})

describe('useRoute', () => {
  it('empieza en la ruta del hash actual', () => {
    window.location.hash = '#/cuenta'
    const { result } = renderHook(() => useRoute())
    expect(result.current.route).toEqual({ name: 'account' })
  })

  it('sigue los cambios de hash (por ejemplo, el botón Atrás)', async () => {
    const { result } = renderHook(() => useRoute())
    expect(result.current.route.name).toBe('create')
    await act(async () => {
      window.location.hash = '#/recetas'
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    })
    expect(result.current.route.name).toBe('library')
  })

  it('navigate acepta rutas con o sin #', async () => {
    const { result } = renderHook(() => useRoute())
    await act(async () => { navigate('/recetas'); window.dispatchEvent(new HashChangeEvent('hashchange')) })
    expect(window.location.hash).toBe('#/recetas')
    await act(async () => { result.current.navigate('#/cuenta'); window.dispatchEvent(new HashChangeEvent('hashchange')) })
    expect(window.location.hash).toBe('#/cuenta')
    expect(result.current.route.name).toBe('account')
  })
})
