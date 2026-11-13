import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PaintForm } from '../index.js'

const setup = (props = {}) => {
  const onSubmit = vi.fn().mockResolvedValue({})
  const onHexChange = vi.fn()
  const onCancel = vi.fn()
  render(<PaintForm hex="#e63946" onHexChange={onHexChange} onSubmit={onSubmit} onCancel={onCancel} {...props} />)
  return { onSubmit, onHexChange, onCancel }
}
const type = (label, value) => fireEvent.change(screen.getByLabelText(label), { target: { value } })

describe('PaintForm', () => {
  it('rechaza el nombre vacío y no envía', () => {
    const { onSubmit } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Ponele un nombre a la pintura.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rechaza un hex inválido', () => {
    const { onSubmit } = setup()
    type('Nombre', 'Rojo')
    type('Color (hex)', '#zz')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText(/hex válido/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('envía nombre recortado y hex normalizado', async () => {
    const { onSubmit } = setup()
    type('Nombre', '  Rojo ')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith({ name: 'Rojo', hex: '#e63946' }))
  })

  it('avisa al padre cuando se escribe un hex válido', () => {
    const { onHexChange } = setup()
    type('Color (hex)', 'abc')
    expect(onHexChange).toHaveBeenCalledWith('#aabbcc')
  })

  it('muestra el error que devuelve el guardado', async () => {
    const onSubmit = vi.fn().mockResolvedValue({ error: 'No pudimos guardar' })
    setup({ onSubmit })
    type('Nombre', 'Rojo')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('No pudimos guardar'))
  })

  it('Cancelar llama onCancel', () => {
    const { onCancel } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
