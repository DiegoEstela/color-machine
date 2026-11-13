import { render, screen, fireEvent } from '@testing-library/react'
import { PaintCard } from '../index.js'

const paint = { id: 'a', name: 'Rojo', hex: '#e63946' }
const setup = (props = {}) => {
  const fns = { onToggle: vi.fn(), onEdit: vi.fn(), onDelete: vi.fn() }
  render(<ul><PaintCard paint={paint} selected={false} {...fns} {...props} /></ul>)
  return fns
}

describe('PaintCard', () => {
  it('tocar la tarjeta alterna la selección y expone el estado', () => {
    const { onToggle } = setup({ selected: true })
    const main = screen.getByRole('button', { name: 'Rojo #e63946' })
    expect(main).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(main)
    expect(onToggle).toHaveBeenCalled()
  })
  it('Editar llama onEdit', () => {
    const { onEdit } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    expect(onEdit).toHaveBeenCalled()
  })
  it('Borrar pide confirmación antes de borrar', () => {
    const { onDelete } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    expect(onDelete).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })
  it('se puede cancelar el borrado', () => {
    const { onDelete } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument()
    expect(onDelete).not.toHaveBeenCalled()
  })
  it('usa la miniatura si existe', () => {
    const { container } = render(<ul><PaintCard paint={paint} thumb="data:x" onToggle={() => {}} onEdit={() => {}} onDelete={() => {}} /></ul>)
    expect(container.querySelector('img')).toHaveAttribute('src', 'data:x')
  })
})
