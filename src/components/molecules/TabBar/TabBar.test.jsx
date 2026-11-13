import { vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TabBar } from '../index.js'

describe('TabBar', () => {
  it('es una navegación con tres enlaces: Recetas, Crear (al centro) y Cuenta', () => {
    render(<TabBar active="create" />)
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links.map((l) => l.textContent)).toEqual(['Recetas', 'Crear', 'Cuenta'])
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['#/recetas', '#/', '#/cuenta'])
  })
  it('marca solo la pestaña activa con aria-current', () => {
    const { rerender } = render(<TabBar active="library" />)
    expect(screen.getByRole('link', { name: 'Recetas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Crear' })).not.toHaveAttribute('aria-current')
    rerender(<TabBar active="account" />)
    expect(screen.getByRole('link', { name: 'Cuenta' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Recetas' })).not.toHaveAttribute('aria-current')
  })
  it('Crear es el botón central destacado', () => {
    render(<TabBar active="library" />)
    const links = screen.getAllByRole('link')
    expect(links[1]).toHaveTextContent('Crear')
    expect(links[1]).toHaveAttribute('data-primary', 'true')
    expect(links[0]).not.toHaveAttribute('data-primary')
  })
  it('vibra al cambiar de pestaña, pero no al tocar la activa', () => {
    navigator.vibrate = vi.fn()
    render(<TabBar active="library" />)
    fireEvent.click(screen.getByRole('link', { name: 'Recetas' }))
    expect(navigator.vibrate).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('link', { name: 'Cuenta' }))
    expect(navigator.vibrate).toHaveBeenCalledTimes(1)
    delete navigator.vibrate
  })
  it('los íconos son decorativos', () => {
    const { container } = render(<TabBar active="create" />)
    for (const svg of container.querySelectorAll('svg')) expect(svg).toHaveAttribute('aria-hidden', 'true')
  })
})
