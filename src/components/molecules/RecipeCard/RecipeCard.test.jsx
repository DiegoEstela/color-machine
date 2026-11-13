import { render, screen, fireEvent } from '@testing-library/react'
import { RecipeCard } from '../index.js'

const recipe = {
  id: 'r1',
  name: 'Mi violeta',
  target_hex: '#5b2a86',
  result_hex: '#583087',
  mix: [{ name: 'Rojo', hex: '#e4002b', parts: 2 }, { name: 'Azul', hex: '#1d3fbb', parts: 1 }],
  created_at: '2026-11-14T12:00:00Z',
}
const setup = (props = {}) => {
  const fns = { onOpen: vi.fn(), onRename: vi.fn(), onDelete: vi.fn() }
  render(<ul><RecipeCard recipe={recipe} {...fns} {...props} /></ul>)
  return fns
}

describe('RecipeCard', () => {
  it('muestra nombre, resumen de partes y fecha', () => {
    setup()
    expect(screen.getByText('Mi violeta')).toBeInTheDocument()
    expect(screen.getByText('2 Rojo · 1 Azul')).toBeInTheDocument()
    expect(screen.getByText(/nov 2026/)).toBeInTheDocument()
  })
  it('dibuja los dos frascos (color buscado y resultado) como decoración', () => {
    const { container } = render(<ul><RecipeCard recipe={recipe} onOpen={() => {}} onRename={() => {}} onDelete={() => {}} /></ul>)
    const jars = container.querySelectorAll('svg[data-size="sm"]')
    expect(jars).toHaveLength(2)
    expect(jars[0].style.getPropertyValue('--jar-color')).toBe('#5b2a86')
    expect(jars[1].style.getPropertyValue('--jar-color')).toBe('#583087')
  })
  it('tocar la receta la abre', () => {
    const { onOpen } = setup()
    fireEvent.click(screen.getByRole('button', { name: /Mi violeta/ }))
    expect(onOpen).toHaveBeenCalled()
  })
  it('Renombrar llama onRename', () => {
    const { onRename } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Renombrar' }))
    expect(onRename).toHaveBeenCalled()
  })
  it('Borrar pide confirmación y se puede cancelar', () => {
    const { onDelete } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
})
