import { render, screen, fireEvent } from '@testing-library/react'
import { PixelIconButton } from '../index.js'

describe('PixelIconButton', () => {
  it('su nombre accesible es la etiqueta y el ícono es decorativo', () => {
    const { container } = render(<PixelIconButton icon="info" label="Más información" />)
    expect(screen.getByRole('button', { name: 'Más información' })).toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
  it('es type=button y llama onClick', () => {
    const onClick = vi.fn()
    render(<PixelIconButton icon="cross" label="Quitar" onClick={onClick} />)
    const btn = screen.getByRole('button', { name: 'Quitar' })
    expect(btn).toHaveAttribute('type', 'button')
    fireEvent.click(btn)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  it('deshabilitado no responde', () => {
    const onClick = vi.fn()
    render(<PixelIconButton icon="cross" label="Quitar" disabled onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(onClick).not.toHaveBeenCalled()
  })
  it('admite variantes y tamaños', () => {
    render(<PixelIconButton icon="cross" label="Quitar" variant="danger" size="sm" />)
    expect(screen.getByRole('button')).toHaveAttribute('data-variant', 'danger')
    expect(screen.getByRole('button')).toHaveAttribute('data-size', 'sm')
  })
  it('la zona táctil extra puede sesgarse hacia arriba', () => {
    render(<PixelIconButton icon="info" label="Info" hitBias="up" />)
    expect(screen.getByRole('button', { name: 'Info' })).toHaveAttribute('data-hit', 'up')
  })
  it('por defecto la zona táctil extra es pareja', () => {
    render(<PixelIconButton icon="info" label="Info" />)
    expect(screen.getByRole('button', { name: 'Info' })).toHaveAttribute('data-hit', 'center')
  })
})
