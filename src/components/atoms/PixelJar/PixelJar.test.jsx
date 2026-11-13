import { render, screen } from '@testing-library/react'
import { PixelJar } from '../index.js'

describe('PixelJar', () => {
  it('con label es una imagen con nombre y color', () => {
    render(<PixelJar color="#e4002b" label="Rojo" />)
    expect(screen.getByRole('img', { name: 'Rojo #e4002b' })).toBeInTheDocument()
  })
  it('sin label es decorativo', () => {
    const { container } = render(<PixelJar color="#e4002b" />)
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
  it('pasa el color al dibujo y admite tamaños y animación de aparición', () => {
    const { container } = render(<PixelJar color="#1d3fbb" size="lg" pop />)
    const svg = container.querySelector('svg')
    expect(svg.style.getPropertyValue('--jar-color')).toBe('#1d3fbb')
    expect(svg).toHaveAttribute('data-size', 'lg')
    expect(svg).toHaveAttribute('data-pop')
  })
})
