import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecipeNameForm } from '../index.js'

const type = (value) => fireEvent.change(screen.getByLabelText('Nombre de la receta'), { target: { value } })

describe('RecipeNameForm', () => {
  it('el campo empieza vacío', () => {
    render(<RecipeNameForm onSubmit={vi.fn()} onCancel={() => {}} />)
    expect(screen.getByLabelText('Nombre de la receta')).toHaveValue('')
  })
  it('puede empezar con un nombre (para renombrar)', () => {
    render(<RecipeNameForm initialName="Violeta" submitLabel="Guardar cambios" onSubmit={vi.fn()} onCancel={() => {}} />)
    expect(screen.getByLabelText('Nombre de la receta')).toHaveValue('Violeta')
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeInTheDocument()
  })
  it('rechaza el nombre vacío y no envía', () => {
    const onSubmit = vi.fn()
    render(<RecipeNameForm onSubmit={onSubmit} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Ponele un nombre a la receta.')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
  it('rechaza un nombre de más de 60 caracteres', () => {
    const onSubmit = vi.fn()
    render(<RecipeNameForm onSubmit={onSubmit} onCancel={() => {}} />)
    type('a'.repeat(61))
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText(/hasta 60 caracteres/)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
  it('envía el nombre sin espacios de los bordes', async () => {
    const onSubmit = vi.fn().mockResolvedValue({})
    render(<RecipeNameForm onSubmit={onSubmit} onCancel={() => {}} />)
    type('  Mi violeta  ')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Mi violeta'))
  })
  it('muestra el error del guardado', async () => {
    render(<RecipeNameForm onSubmit={vi.fn().mockResolvedValue({ error: 'Sin conexión.' })} onCancel={() => {}} />)
    type('x')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión.')
  })
  it('Cancelar llama onCancel', () => {
    const onCancel = vi.fn()
    render(<RecipeNameForm onSubmit={vi.fn()} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancel).toHaveBeenCalled()
  })
})
