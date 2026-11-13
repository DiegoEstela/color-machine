import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PaintCapture } from '../index.js'

const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('PaintCapture', () => {
  it('guarda una pintura solo con nombre y hex (sin foto)', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ data: {} })
    const onDone = vi.fn()
    render(<PaintCapture onSubmit={onSubmit} onCancel={() => {}} onDone={onDone} />)
    type('Nombre', 'Azul')
    type('Color (hex)', '#0000ff')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar pintura' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Azul', hex: '#0000ff' }, null))
    expect(onDone).toHaveBeenCalled()
  })

  it('no cierra si el guardado falla y muestra el error', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ error: 'Sin conexión' })
    const onDone = vi.fn()
    render(<PaintCapture onSubmit={onSubmit} onCancel={() => {}} onDone={onDone} />)
    type('Nombre', 'Azul')
    type('Color (hex)', '#0000ff')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar pintura' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión'))
    expect(onDone).not.toHaveBeenCalled()
  })

  it('muestra el color elegido en vivo', () => {
    render(<PaintCapture onSubmit={vi.fn()} onCancel={() => {}} />)
    type('Color (hex)', '#ff0000')
    expect(screen.getByRole('img', { name: 'Color de la pintura #ff0000' })).toBeInTheDocument()
  })

  it('ofrece cámara y galería', () => {
    render(<PaintCapture onSubmit={vi.fn()} onCancel={() => {}} />)
    expect(screen.getByRole('button', { name: /Cámara/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Galería/ })).toBeInTheDocument()
  })
})
