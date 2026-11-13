import { render, screen } from '@testing-library/react'
import { StepIndicator } from '../index.js'

describe('StepIndicator', () => {
  it('describe el paso actual para lectores de pantalla', () => {
    render(<StepIndicator step={2} total={3} />)
    expect(screen.getByRole('list', { name: 'Paso 2 de 3' })).toBeInTheDocument()
    expect(screen.getByText('Paso 2 de 3')).toBeInTheDocument()
  })
  it('marca un solo paso como actual y lo nombra para lectores de pantalla', () => {
    render(<StepIndicator step={2} total={3} />)
    const current = screen.getAllByRole('listitem').filter((li) => li.getAttribute('aria-current') === 'step')
    expect(current).toHaveLength(1)
    expect(current[0]).toHaveTextContent('Pinturas')
  })
  it('distingue pasos hechos, actual y pendientes', () => {
    render(<StepIndicator step={2} total={3} />)
    const states = screen.getAllByRole('listitem').map((li) => li.dataset.state)
    expect(states).toEqual(['done', 'current', 'pending'])
  })
  it('en el primer paso no hay ninguno hecho; en el último, los dos anteriores', () => {
    const { rerender } = render(<StepIndicator step={1} total={3} />)
    expect(screen.getAllByRole('listitem').map((li) => li.dataset.state)).toEqual(['current', 'pending', 'pending'])
    rerender(<StepIndicator step={3} total={3} />)
    expect(screen.getAllByRole('listitem').map((li) => li.dataset.state)).toEqual(['done', 'done', 'current'])
  })
})
