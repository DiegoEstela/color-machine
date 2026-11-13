import { render, screen } from '@testing-library/react'
import { PixelBar } from '../index.js'

describe('PixelBar', () => {
  it('expone valores de progreso y limita al máximo', () => {
    render(<PixelBar value={9} max={4} label="Rojo" />)
    const bar = screen.getByRole('progressbar', { name: 'Rojo' })
    expect(bar).toHaveAttribute('aria-valuenow', '4')
    expect(bar.children).toHaveLength(4)
  })
  it('admite tamaño compacto', () => {
    render(<PixelBar value={1} max={3} label="Paso" size="sm" />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'sm')
  })
})
