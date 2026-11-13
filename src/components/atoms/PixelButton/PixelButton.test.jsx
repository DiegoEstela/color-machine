import { render, screen, fireEvent } from '@testing-library/react'
import { PixelButton } from '../index.js'

describe('PixelButton', () => {
  it('llama onClick', () => {
    const onClick = vi.fn()
    render(<PixelButton onClick={onClick}>Ok</PixelButton>)
    fireEvent.click(screen.getByRole('button', { name: 'Ok' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  it('no dispara onClick si está deshabilitado', () => {
    const onClick = vi.fn()
    render(<PixelButton disabled onClick={onClick}>Ok</PixelButton>)
    fireEvent.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })
  it('expone la variante y es type=button por defecto', () => {
    render(<PixelButton variant="danger">X</PixelButton>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('data-variant', 'danger')
    expect(btn).toHaveAttribute('type', 'button')
  })
})
