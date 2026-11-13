import { render, screen } from '@testing-library/react'
import { RecipeRow } from '../index.js'

const wrap = (ui) => render(<ul>{ui}</ul>)

describe('RecipeRow', () => {
  it('muestra el nombre y las partes en plural', () => {
    wrap(<RecipeRow name="Rojo" hex="#e4002b" parts={2} total={3} />)
    expect(screen.getByText('Rojo')).toBeInTheDocument()
    expect(screen.getByText('2 partes')).toBeInTheDocument()
  })
  it('usa singular con 1 parte', () => {
    wrap(<RecipeRow name="Azul" hex="#1d3fbb" parts={1} total={3} />)
    expect(screen.getByText('1 parte')).toBeInTheDocument()
  })
  it('la barra es proporcional al total y accesible', () => {
    wrap(<RecipeRow name="Rojo" hex="#e4002b" parts={2} total={5} />)
    const bar = screen.getByRole('progressbar', { name: 'Rojo: 2 de 5 partes' })
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemax', '5')
  })
})
