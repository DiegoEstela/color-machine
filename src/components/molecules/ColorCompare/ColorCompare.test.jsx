import { render, screen } from '@testing-library/react'
import { ColorCompare } from '../index.js'

describe('ColorCompare', () => {
  it('muestra tu color y tu mezcla con nombres accesibles', () => {
    render(<ColorCompare target="#5b2a86" mix="#583087" quality="Casi idéntico" deltaE={1.234} />)
    expect(screen.getByRole('img', { name: 'Tu color #5b2a86' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tu mezcla #583087' })).toBeInTheDocument()
  })
  it('dice qué tan parecidos son, en palabras y con el ΔE', () => {
    render(<ColorCompare target="#5b2a86" mix="#583087" quality="Casi idéntico" deltaE={1.234} />)
    expect(screen.getByRole('status')).toHaveTextContent('Casi idéntico')
    expect(screen.getByRole('status')).toHaveTextContent('ΔE 1.2')
  })
})
