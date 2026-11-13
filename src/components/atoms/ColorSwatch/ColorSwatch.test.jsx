import { render, screen, fireEvent } from '@testing-library/react'
import { ColorSwatch } from '../index.js'

describe('ColorSwatch', () => {
  it('es una imagen con nombre accesible si no es clickeable', () => {
    render(<ColorSwatch color="#ffc8dd" label="Rosa" />)
    expect(screen.getByRole('img', { name: 'Rosa #ffc8dd' })).toBeInTheDocument()
  })
  it('es un botón seleccionable si tiene onClick', () => {
    const onClick = vi.fn()
    render(<ColorSwatch color="#ffc8dd" selected onClick={onClick} />)
    const btn = screen.getByRole('button', { name: '#ffc8dd' })
    expect(btn).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalled()
  })
})
