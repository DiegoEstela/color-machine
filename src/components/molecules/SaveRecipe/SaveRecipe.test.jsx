import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SaveRecipe } from '../index.js'

describe('SaveRecipe', () => {
  it('empieza con el botón "Guardar receta" y sin formulario', () => {
    render(<SaveRecipe saved={false} onSave={vi.fn()} onOpenLibrary={() => {}} />)
    expect(screen.getByRole('button', { name: 'Guardar receta' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Nombre de la receta')).not.toBeInTheDocument()
  })

  it('al tocarlo abre el formulario con el nombre vacío', () => {
    render(<SaveRecipe saved={false} onSave={vi.fn()} onOpenLibrary={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar receta' }))
    expect(screen.getByLabelText('Nombre de la receta')).toHaveValue('')
  })

  it('guarda con el nombre escrito y cierra el formulario', async () => {
    const onSave = vi.fn().mockResolvedValue({})
    render(<SaveRecipe saved={false} onSave={onSave} onOpenLibrary={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar receta' }))
    fireEvent.change(screen.getByLabelText('Nombre de la receta'), { target: { value: 'Violeta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Violeta'))
    await waitFor(() => expect(screen.queryByLabelText('Nombre de la receta')).not.toBeInTheDocument())
  })

  it('si el guardado falla deja el formulario abierto con el mensaje', async () => {
    render(<SaveRecipe saved={false} onSave={vi.fn().mockResolvedValue({ error: 'Sin conexión.' })} onOpenLibrary={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar receta' }))
    fireEvent.change(screen.getByLabelText('Nombre de la receta'), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión.')
    expect(screen.getByLabelText('Nombre de la receta')).toBeInTheDocument()
  })

  it('cancelar vuelve al botón', () => {
    render(<SaveRecipe saved={false} onSave={vi.fn()} onOpenLibrary={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar receta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('button', { name: 'Guardar receta' })).toBeInTheDocument()
  })

  it('una vez guardada muestra la confirmación, el botón "Guardada" deshabilitado y el acceso a Recetas', () => {
    const onOpenLibrary = vi.fn()
    render(<SaveRecipe saved onSave={vi.fn()} onOpenLibrary={onOpenLibrary} />)
    expect(screen.getByText('¡Receta guardada!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardada' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Guardar receta' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver mis recetas' }))
    expect(onOpenLibrary).toHaveBeenCalled()
  })
})
