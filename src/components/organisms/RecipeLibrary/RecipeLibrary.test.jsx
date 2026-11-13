import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecipeLibrary } from '../index.js'

const recipe = (id, name) => ({
  id, name, target_hex: '#5b2a86', result_hex: '#583087',
  mix: [{ name: 'Rojo', hex: '#e4002b', parts: 2 }, { name: 'Azul', hex: '#1d3fbb', parts: 1 }],
  created_at: '2026-11-14T12:00:00Z',
})
const recipes = [recipe('a', 'Violeta suave'), recipe('b', 'Verde bosque')]
const base = { recipes, status: 'ready', error: null }
const handlers = () => ({
  onOpen: vi.fn(), onRename: vi.fn().mockResolvedValue({}), onRemove: vi.fn().mockResolvedValue({}),
  onRetry: vi.fn(), onCreate: vi.fn(),
})

describe('RecipeLibrary', () => {
  it('muestra cargando, error con reintento y vacío con acceso a crear', () => {
    const h = handlers()
    const { rerender } = render(<RecipeLibrary {...base} {...h} status="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('Cargando')
    rerender(<RecipeLibrary {...base} {...h} status="error" error="Sin conexión. Revisá tu internet." />)
    expect(screen.getByRole('alert')).toHaveTextContent('Sin conexión')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(h.onRetry).toHaveBeenCalled()
    rerender(<RecipeLibrary {...base} {...h} recipes={[]} />)
    expect(screen.getByText('Todavía no guardaste recetas.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Crear una mezcla' }))
    expect(h.onCreate).toHaveBeenCalled()
  })

  it('lista las recetas en el orden recibido (la más nueva primero)', () => {
    render(<RecipeLibrary {...base} {...handlers()} />)
    const names = screen.getAllByRole('button', { name: /Violeta suave|Verde bosque/ }).map((b) => b.textContent)
    expect(names[0]).toMatch(/Violeta suave/)
    expect(names[1]).toMatch(/Verde bosque/)
  })

  it('tocar una receta la abre', () => {
    const h = handlers()
    render(<RecipeLibrary {...base} {...h} />)
    fireEvent.click(screen.getByRole('button', { name: /Verde bosque/ }))
    expect(h.onOpen).toHaveBeenCalledWith('b')
  })

  it('renombra una receta con el formulario en el lugar', async () => {
    const h = handlers()
    render(<RecipeLibrary {...base} {...h} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Renombrar' })[0])
    expect(screen.getByLabelText('Nombre de la receta')).toHaveValue('Violeta suave')
    fireEvent.change(screen.getByLabelText('Nombre de la receta'), { target: { value: 'Violeta fuerte' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(h.onRename).toHaveBeenCalledWith('a', 'Violeta fuerte'))
    await waitFor(() => expect(screen.queryByLabelText('Nombre de la receta')).not.toBeInTheDocument())
  })

  it('si renombrar falla deja el formulario con el mensaje', async () => {
    const h = handlers()
    h.onRename.mockResolvedValue({ error: 'Sin conexión.' })
    render(<RecipeLibrary {...base} {...h} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Renombrar' })[0])
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión.')
    expect(screen.getByLabelText('Nombre de la receta')).toBeInTheDocument()
  })

  it('borra con confirmación y muestra el error si falla sin perder la lista', async () => {
    const h = handlers()
    h.onRemove.mockResolvedValue({ error: 'No se pudo borrar' })
    render(<RecipeLibrary {...base} {...h} />)
    fireEvent.click(screen.getAllByRole('button', { name: 'Borrar' })[1])
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(h.onRemove).toHaveBeenCalledWith('b'))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo borrar')
    expect(screen.getByRole('button', { name: /Verde bosque/ })).toBeInTheDocument()
  })
})
