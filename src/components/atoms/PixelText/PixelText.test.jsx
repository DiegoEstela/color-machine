import { render, screen } from '@testing-library/react'
import { PixelText } from '../index.js'

describe('PixelText', () => {
  it('conserva sus estilos aunque se le pase una clase extra', () => {
    render(<PixelText className="extra">hola</PixelText>)
    const el = screen.getByText('hola')
    expect(el.className).toMatch(/text/)
    expect(el.className).toMatch(/extra/)
  })
  it('sin clase extra usa solo la suya (no queda "undefined")', () => {
    render(<PixelText>hola</PixelText>)
    expect(screen.getByText('hola').className).not.toMatch(/undefined/)
  })
  it('usa la etiqueta, el tamaño y el tono pedidos', () => {
    render(<PixelText as="h2" size="lg" tone="soft">título</PixelText>)
    const el = screen.getByRole('heading', { name: 'título' })
    expect(el).toHaveAttribute('data-size', 'lg')
    expect(el).toHaveAttribute('data-tone', 'soft')
  })
})
