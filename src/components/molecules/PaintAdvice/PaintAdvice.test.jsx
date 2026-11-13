import { render, screen, fireEvent } from '@testing-library/react'
import { PaintAdvice } from '../index.js'

const rojo = { id: 'base-rojo', name: 'Rojo', hex: '#e4002b' }
const azul = { id: 'base-azul', name: 'Azul', hex: '#1d3fbb' }

describe('PaintAdvice', () => {
  it('no muestra nada sin consejos', () => {
    const { container } = render(<PaintAdvice items={[]} onAdd={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })
  it('marca "la tenés" con el nombre de la pintura del usuario y "Agregar" para las que faltan', () => {
    render(
      <PaintAdvice
        items={[{ role: rojo, status: 'have', paint: { name: 'Mi rojo' } }, { role: azul, status: 'missing' }]}
        onAdd={() => {}}
      />,
    )
    expect(screen.getByText('la tenés (Mi rojo)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Agregar Azul' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Agregar Rojo' })).not.toBeInTheDocument()
  })
  it('no repite el nombre si la pintura del usuario se llama igual que la base', () => {
    render(<PaintAdvice items={[{ role: rojo, status: 'have', paint: { name: 'Rojo' } }]} onAdd={() => {}} />)
    expect(screen.getByText('la tenés')).toBeInTheDocument()
  })
  it('avisa qué pintura se quiere agregar', () => {
    const onAdd = vi.fn()
    render(<PaintAdvice items={[{ role: azul, status: 'missing' }]} onAdd={onAdd} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agregar Azul' }))
    expect(onAdd).toHaveBeenCalledWith(azul)
  })
  it('si no falta nada lo dice', () => {
    render(<PaintAdvice items={[{ role: rojo, status: 'have', paint: { name: 'R' } }]} onAdd={() => {}} />)
    expect(screen.getByText('Ya tenés todo lo necesario.')).toBeInTheDocument()
  })
})
