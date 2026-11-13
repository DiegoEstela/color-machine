import { render, screen } from '@testing-library/react'
import { PixelMeter } from '../index.js'

describe('PixelMeter', () => {
  it('expone el valor y el texto del valor', () => {
    render(<PixelMeter level={3} label="Parecido" valueText="Muy parecido" />)
    const meter = screen.getByRole('meter', { name: 'Parecido' })
    expect(meter).toHaveAttribute('aria-valuenow', '3')
    expect(meter).toHaveAttribute('aria-valuemax', '4')
    expect(meter).toHaveAttribute('aria-valuetext', 'Muy parecido')
    expect(meter.children).toHaveLength(4)
  })
  it('limita el nivel entre 0 y el máximo', () => {
    const { rerender } = render(<PixelMeter level={9} label="x" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '4')
    rerender(<PixelMeter level={-2} label="x" />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '0')
  })
  it('admite tamaño chico', () => {
    render(<PixelMeter level={2} label="x" size="sm" />)
    expect(screen.getByRole('meter')).toHaveAttribute('data-size', 'sm')
  })
})
