import { render, screen, fireEvent } from '@testing-library/react'
import Create from './Create.jsx'
import { useMixStore } from '../../features/color-mixer/mixStore.js'

beforeEach(() => useMixStore.getState().reset())

describe('Create', () => {
  it('flujo: elegir color por hex, avanzar y volver conservando el color', () => {
    render(<Create />)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Color (hex)'), { target: { value: '#e63946' } })
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByText('Paso 2 de 3')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Color objetivo #e63946' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByLabelText('Color (hex)')).toHaveValue('#e63946')
  })
})
