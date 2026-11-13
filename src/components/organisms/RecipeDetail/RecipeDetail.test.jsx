import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecipeDetail } from '../index.js'

const recipe = {
  id: 'r1',
  name: 'Mi violeta',
  target_hex: '#5b2a86',
  result_hex: '#583087',
  mix: [{ name: 'Rojo', hex: '#e4002b', parts: 2 }, { name: 'Azul', hex: '#1d3fbb', parts: 1 }],
  created_at: '2026-11-14T12:00:00Z',
}
const setup = (props = {}) => {
  const fns = { onRename: vi.fn().mockResolvedValue({}), onRemove: vi.fn().mockResolvedValue({}), onRemix: vi.fn() }
  render(<RecipeDetail recipe={recipe} {...fns} {...props} />)
  return fns
}

describe('RecipeDetail: editar', () => {
  it('tiene "Editar mezcla" y avisa con la receta', () => {
    const onEdit = vi.fn()
    setup({ onEdit })
    fireEvent.click(screen.getByRole('button', { name: 'Editar mezcla' }))
    expect(onEdit).toHaveBeenCalledWith(recipe)
  })
  it('sin onEdit no muestra el botón', () => {
    setup()
    expect(screen.queryByRole('button', { name: 'Editar mezcla' })).not.toBeInTheDocument()
  })
})

describe('RecipeDetail', () => {
  it('muestra el nombre, la comparación con el medidor y las partes por pintura', () => {
    setup()
    expect(screen.getByRole('heading', { name: 'Mi violeta' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tu color #5b2a86' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tu mezcla #583087' })).toBeInTheDocument()
    expect(screen.getByRole('meter')).toBeInTheDocument()
    expect(screen.getByText('2 partes')).toBeInTheDocument()
    expect(screen.getByText('1 parte')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Rojo: 2 de 3 partes' })).toBeInTheDocument()
  })

  it('incluye la nota de "1 parte"', () => {
    setup()
    expect(screen.getByRole('note', { name: 'Qué es una parte' })).toHaveTextContent('1 parte = la medida que quieras')
  })

  it('"Mezclar este color otra vez" avisa con la receta', () => {
    const { onRemix } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Mezclar este color otra vez' }))
    expect(onRemix).toHaveBeenCalledWith(recipe)
  })

  it('renombra con el formulario y lo cierra al terminar', async () => {
    const { onRename } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Renombrar' }))
    fireEvent.change(screen.getByLabelText('Nombre de la receta'), { target: { value: 'Otro nombre' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))
    await waitFor(() => expect(onRename).toHaveBeenCalledWith('r1', 'Otro nombre'))
    await waitFor(() => expect(screen.queryByLabelText('Nombre de la receta')).not.toBeInTheDocument())
  })

  it('borra solo después de confirmar', async () => {
    const { onRemove } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    expect(onRemove).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(onRemove).toHaveBeenCalledWith('r1'))
  })

  it('se puede cancelar el borrado', () => {
    const { onRemove } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'No' }))
    expect(screen.getByRole('button', { name: 'Borrar' })).toBeInTheDocument()
    expect(onRemove).not.toHaveBeenCalled()
  })

  it('un error al borrar o renombrar se muestra sin perder la pantalla', async () => {
    setup({ onRemove: vi.fn().mockResolvedValue({ error: 'Sin conexión.' }) })
    fireEvent.click(screen.getByRole('button', { name: 'Borrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión.')
    expect(screen.getByRole('heading', { name: 'Mi violeta' })).toBeInTheDocument()
  })
})
