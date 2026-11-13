import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mixHex } from '../../../features/color-mixer/mixer.js'
import { resetOwnBack } from '../../molecules/InfoSheet/historyGuard.js'
import { RecipeEditor } from '../index.js'

const recipe = {
  id: 'r1',
  name: 'Mi violeta',
  target_hex: '#5b2a86',
  result_hex: '#583087',
  mix: [{ name: 'Rojo', hex: '#e4002b', parts: 2 }, { name: 'Azul', hex: '#1d3fbb', parts: 1 }],
  created_at: '2026-11-14T12:00:00Z',
}
const paints = [{ id: 'p1', name: 'Carmín', hex: '#aa1020' }]
const settle = () => new Promise((r) => setTimeout(r, 30))

const setup = (props = {}) => {
  const fns = {
    onSave: vi.fn().mockResolvedValue({ href: '#/recetas/r1' }),
    onSaveCopy: vi.fn().mockResolvedValue({ href: '#/recetas/r2' }),
    onSaved: (outcome) => outcome.href,
  }
  render(<RecipeEditor recipe={recipe} paints={paints} {...fns} {...props} />)
  return fns
}
const mixImg = () => screen.getByRole('img', { name: /^Tu mezcla #/ }).getAttribute('aria-label')

beforeEach(async () => { window.location.hash = '#/recetas/r1/editar'; await settle(); resetOwnBack() })
afterEach(async () => { window.location.hash = ''; await settle(); resetOwnBack() })

describe('RecipeEditor', () => {
  it('al abrir coincide con lo guardado: sin cambios no se puede guardar ni restablecer', () => {
    setup()
    expect(screen.getByText(/^Antes: (.+) · Ahora: \1$/)).toBeInTheDocument() // "Antes" y "Ahora" coinciden
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Guardar como copia' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Restablecer' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeDisabled()
    expect(screen.getByRole('group', { name: 'Partes de Rojo' })).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Partes de Azul' })).toBeInTheDocument()
  })

  it('sumar y quitar partes cambia la mezcla en vivo y habilita guardar', () => {
    setup()
    const before = mixImg()
    fireEvent.click(screen.getByRole('button', { name: 'Sumar una parte de Azul' }))
    expect(within(screen.getByRole('group', { name: 'Partes de Azul' })).getByRole('status')).toHaveTextContent('2')
    expect(mixImg()).not.toBe(before)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Deshacer' })).toBeEnabled()
  })

  it('Más claro suma blanco y Más oscuro suma negro, con una fila nueva', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    expect(screen.getByRole('group', { name: 'Partes de Blanco' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Más oscuro' }))
    expect(screen.getByRole('group', { name: 'Partes de Negro' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    expect(within(screen.getByRole('group', { name: 'Partes de Blanco' })).getByRole('status')).toHaveTextContent('2')
  })

  it('quitar una pintura con ✕, pero la última no se puede quitar', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Quitar Rojo' }))
    expect(screen.queryByRole('group', { name: 'Partes de Rojo' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Quitar Azul' })).toBeDisabled()
  })

  it('"Sumar otro color" abre el selector y suma la pintura elegida con 1 parte', async () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Sumar otro color' }))
    const dialog = screen.getByRole('dialog', { name: 'Sumar otro color' })
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sumar Carmín' }))
    expect(screen.queryByRole('dialog', { name: 'Sumar otro color' })).not.toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: 'Partes de Carmín' })).getByRole('status')).toHaveTextContent('1')
  })

  it('el selector muestra "Te conviene sumar" con el consejo completo para acercarse al color buscado', async () => {
    setup({ recipe: { ...recipe, target_hex: '#d9c6ef' } }) // un lavanda que pide blanco
    fireEvent.click(screen.getByRole('button', { name: 'Sumar otro color' }))
    const region = await screen.findByRole('region', { name: 'Te conviene sumar' }, { timeout: 4000 })
    expect(region).toHaveTextContent(/Blanco/)
  })

  it('si la receta ya alcanza, el selector no se queda "buscando" para siempre', async () => {
    setup({ recipe: { ...recipe, target_hex: mixHex(recipe.mix.map((m) => ({ hex: m.hex, parts: m.parts }))) } }) // el color buscado es justo lo que da la mezcla
    fireEvent.click(screen.getByRole('button', { name: 'Sumar otro color' }))
    await waitFor(() => expect(screen.queryByText(/Buscando qué te conviene sumar/)).not.toBeInTheDocument(), { timeout: 4000 })
    expect(screen.queryByRole('region', { name: 'Te conviene sumar' })).not.toBeInTheDocument()
  })

  it('Deshacer y Restablecer vuelven atrás', () => {
    setup()
    const original = mixImg()
    fireEvent.click(screen.getByRole('button', { name: 'Más oscuro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sumar una parte de Rojo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }))
    expect(screen.queryByRole('group', { name: 'Partes de Negro' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
    expect(screen.queryByRole('group', { name: 'Partes de Negro' })).not.toBeInTheDocument()
    expect(mixImg()).toBe(original)
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled()
  })

  it('indica si el cambio mejoró o empeoró la receta respecto del color buscado', () => {
    setup()
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    expect(screen.getByText('Se alejó de tu color. Podés deshacer.')).toBeInTheDocument()
  })

  it('Guardar cambios manda solo mix y result_hex y navega a la receta', async () => {
    const { onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })) })
    expect(onSave).toHaveBeenCalledTimes(1)
    const payload = onSave.mock.calls[0][0]
    expect(Object.keys(payload).sort()).toEqual(['mix', 'result_hex'])
    expect(payload.mix.find((m) => m.name === 'Blanco').parts).toBe(1)
    await waitFor(() => expect(window.location.hash).toBe('#/recetas/r1'))
  })

  it('Guardar como copia pide el nombre ("… (editada)") y crea la copia', async () => {
    const { onSaveCopy, onSave } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Más oscuro' }))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar como copia' }))
    const input = screen.getByLabelText(/Nombre/)
    expect(input).toHaveValue('Mi violeta (editada)')
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar copia' })) })
    expect(onSaveCopy).toHaveBeenCalledWith('Mi violeta (editada)', expect.objectContaining({ result_hex: expect.any(String) }))
    expect(onSave).not.toHaveBeenCalled()
    await waitFor(() => expect(window.location.hash).toBe('#/recetas/r2'))
  })

  it('si guardar falla muestra el error y conserva el borrador', async () => {
    setup({ onSave: vi.fn().mockResolvedValue({ error: 'Sin conexión. Revisá tu internet.' }) })
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' })) })
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión')
    expect(screen.getByRole('group', { name: 'Partes de Blanco' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeEnabled()
  })

  it('con cambios sin guardar, tocar un enlace pregunta si se descartan; "Seguir editando" se queda', () => {
    setup()
    render(<a href="#/recetas">Recetas</a>)
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    fireEvent.click(screen.getByRole('link', { name: 'Recetas' }))
    expect(screen.getByRole('dialog', { name: '¿Descartar los cambios?' })).toBeInTheDocument()
    expect(window.location.hash).toBe('#/recetas/r1/editar')
    fireEvent.click(screen.getByRole('button', { name: 'Seguir editando' }))
    expect(screen.queryByRole('dialog', { name: '¿Descartar los cambios?' })).not.toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Partes de Blanco' })).toBeInTheDocument()
  })

  it('"Descartar cambios" sale a donde se quería ir', async () => {
    setup()
    render(<a href="#/recetas">Recetas</a>)
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    fireEvent.click(screen.getByRole('link', { name: 'Recetas' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Descartar cambios' })) })
    await waitFor(() => expect(window.location.hash).toBe('#/recetas'))
  })

  it('sin cambios no pregunta al salir', () => {
    setup()
    render(<a href="#/recetas">Recetas</a>)
    fireEvent.click(screen.getByRole('link', { name: 'Recetas' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
