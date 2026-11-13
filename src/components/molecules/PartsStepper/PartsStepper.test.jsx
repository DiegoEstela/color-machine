import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PartsStepper } from '../index.js'

describe('PartsStepper', () => {
  it('es un grupo con botones con el nombre de la pintura y el valor leído', () => {
    render(<PartsStepper name="Rojo" parts={2} onChange={() => {}} />)
    expect(screen.getByRole('group', { name: 'Partes de Rojo' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sumar una parte de Rojo' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Quitar una parte de Rojo' })).toBeEnabled()
    expect(screen.getByRole('status', { name: '2 partes' })).toHaveTextContent('2')
  })
  it('avisa -1 y +1', () => {
    const onChange = vi.fn()
    render(<PartsStepper name="Rojo" parts={2} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Sumar una parte de Rojo' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quitar una parte de Rojo' }))
    expect(onChange.mock.calls).toEqual([[1], [-1]])
  })
  it('en el mínimo y el máximo deshabilita el botón correspondiente', () => {
    const { rerender } = render(<PartsStepper name="Rojo" parts={1} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Quitar una parte de Rojo' })).toBeDisabled()
    expect(screen.getByRole('status', { name: '1 parte' })).toBeInTheDocument()
    rerender(<PartsStepper name="Rojo" parts={20} onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Sumar una parte de Rojo' })).toBeDisabled()
  })
})
