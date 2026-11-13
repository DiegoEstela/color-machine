import { render, screen } from '@testing-library/react'
import { MixingAnimation } from '../index.js'

describe('MixingAnimation', () => {
  it('avisa "Mezclando..." a lectores de pantalla', () => {
    render(<MixingAnimation colors={['#e4002b', '#1d3fbb']} />)
    expect(screen.getByRole('status')).toHaveTextContent('Mezclando...')
  })
  it('dibuja una capa por color (máximo 4) sin romperse sin colores', () => {
    const { container, rerender } = render(<MixingAnimation colors={['#1', '#2', '#3', '#4', '#5', '#6']} />)
    expect(container.querySelectorAll('[style*="--layer-color"]')).toHaveLength(4)
    rerender(<MixingAnimation />)
    expect(container.querySelectorAll('[style*="--layer-color"]')).toHaveLength(0)
  })
})
