import { render, screen } from '@testing-library/react'
import { PixelInput } from '../index.js'

describe('PixelInput', () => {
  it('asocia la etiqueta con el campo', () => {
    render(<PixelInput label="Email" defaultValue="a@b.c" />)
    expect(screen.getByLabelText('Email')).toHaveValue('a@b.c')
  })
  it('muestra el error y lo vincula con aria', () => {
    render(<PixelInput label="Email" error="Inválido" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Inválido')
    expect(screen.getByRole('alert')).toHaveTextContent('Inválido')
  })
})
