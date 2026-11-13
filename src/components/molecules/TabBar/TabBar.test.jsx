import { render, screen } from '@testing-library/react'
import { TabBar } from '../index.js'

describe('TabBar', () => {
  it('es una navegación con tres enlaces: Crear, Recetas y Cuenta', () => {
    render(<TabBar active="create" />)
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['Crear', 'Recetas', 'Cuenta'])
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['#/', '#/recetas', '#/cuenta'])
  })
  it('marca solo la pestaña activa con aria-current', () => {
    const { rerender } = render(<TabBar active="library" />)
    expect(screen.getByRole('link', { name: 'Recetas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Crear' })).not.toHaveAttribute('aria-current')
    rerender(<TabBar active="account" />)
    expect(screen.getByRole('link', { name: 'Cuenta' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Recetas' })).not.toHaveAttribute('aria-current')
  })
  it('los íconos son decorativos', () => {
    const { container } = render(<TabBar active="create" />)
    for (const svg of container.querySelectorAll('svg')) expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
