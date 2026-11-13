import { render, screen } from '@testing-library/react'
import { ColorCompare } from '../index.js'

describe('ColorCompare', () => {
  it('muestra tu color y tu mezcla en frascos con nombres accesibles', () => {
    render(<ColorCompare target="#5b2a86" mix="#583087" quality="Casi idéntico" deltaE={1.234} />)
    expect(screen.getByRole('img', { name: 'Tu color #5b2a86' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tu mezcla #583087' })).toBeInTheDocument()
  })
  it('dice qué tan parecidos son, en palabras, y el ΔE queda solo para lectores de pantalla', () => {
    render(<ColorCompare target="#5b2a86" mix="#583087" quality="Casi idéntico" deltaE={1.234} />)
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Casi idéntico')
    expect(status).toHaveTextContent('ΔE 1.2')
    // no hay ningún texto visible con el ΔE (el span que lo contiene está oculto visualmente)
    expect(screen.getByText(/ΔE 1\.2/).className).toMatch(/hidden/)
  })
  it('el medidor refleja la calidad (4 = casi idéntico, 1 = aproximado)', () => {
    const { rerender } = render(<ColorCompare target="#000" mix="#111" quality="Casi idéntico" deltaE={1} />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '4')
    rerender(<ColorCompare target="#000" mix="#fff" quality="Aproximado" deltaE={40} />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuetext', 'Aproximado (ΔE 40.0)')
  })
})
