import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PaintList } from '../index.js'

const paints = [
  { id: 'a', name: 'Rojo', hex: '#e63946' },
  { id: 'b', name: 'Azul', hex: '#457b9d' },
]
const base = { paints, selectedIds: ['a'], thumbs: {}, status: 'ready', error: null }
const handlers = () => ({ onToggle: vi.fn(), onUpdate: vi.fn().mockResolvedValue({}), onRemove: vi.fn().mockResolvedValue({}), onRetry: vi.fn() })

describe('PaintList', () => {
  it('muestra cargando, error con reintento y estado vacío', () => {
    const h = handlers()
    const { rerender } = render(<PaintList {...base} {...h} status="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
    rerender(<PaintList {...base} {...h} status="error" error="Sin conexión" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(h.onRetry).toHaveBeenCalled()
    rerender(<PaintList {...base} {...h} paints={[]} />)
    expect(screen.getByText(/Todavía no tenés pinturas/)).toBeInTheDocument()
  })

  it('lista las pinturas y marca las seleccionadas', () => {
    render(<PaintList {...base} {...handlers()} />)
    expect(screen.getByRole('button', { name: 'Rojo #e63946' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Azul #457b9d' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('alterna la selección', () => {
    const h = handlers()
    render(<PaintList {...base} {...h} />)
    fireEvent.click(screen.getByRole('button', { name: 'Azul #457b9d' }))
    expect(h.onToggle).toHaveBeenCalledWith('b')
  })

  it('edita el nombre de una pintura', async () => {
    const h = handlers()
    render(<PaintList {...base} {...h} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Editar' })[0])
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Rojo fuerte' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(h.onUpdate).toHaveBeenCalledWith('a', { name: 'Rojo fuerte', hex: '#e63946' }))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Guardar cambios' })).not.toBeInTheDocument())
  })

  it('borra con confirmación y muestra el error si falla', async () => {
    const h = handlers()
    h.onRemove.mockResolvedValue({ error: 'No se pudo borrar' })
    render(<PaintList {...base} {...h} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Borrar' })[1])
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(h.onRemove).toHaveBeenCalledWith('b'))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No se pudo borrar'))
  })
})
