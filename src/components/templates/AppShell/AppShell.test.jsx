import { render, screen } from '@testing-library/react'
import { AppShell } from '../index.js'

describe('AppShell', () => {
  it('tiene barra superior con el título, contenido y barra de pestañas', () => {
    render(<AppShell title="Elegí tu color" activeTab="create"><p>contenido</p></AppShell>)
    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('heading', { name: 'Elegí tu color' }))
    expect(screen.getByRole('main')).toHaveTextContent('contenido')
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
  })

  it('la pestaña activa viene de activeTab', () => {
    render(<AppShell title="Mis recetas" activeTab="library">x</AppShell>)
    expect(screen.getByRole('link', { name: 'Recetas' })).toHaveAttribute('aria-current', 'page')
  })

  it('muestra las acciones a la derecha de la barra superior', () => {
    render(<AppShell title="t" actions={<span>pasos</span>}>x</AppShell>)
    expect(screen.getByRole('banner')).toContainElement(screen.getByText('pasos'))
  })

  it('con `back` muestra una flecha accesible en lugar del logo', () => {
    render(<AppShell title="Receta" back={{ href: '#/recetas', label: 'Volver a mis recetas' }}>x</AppShell>)
    const back = screen.getByRole('link', { name: 'Volver a mis recetas' })
    expect(back).toHaveAttribute('href', '#/recetas')
    expect(screen.getByRole('banner').querySelectorAll('svg')).toHaveLength(1) // solo la flecha
  })

  it('sin `back` muestra el logo', () => {
    render(<AppShell title="t">x</AppShell>)
    expect(screen.getByRole('banner').querySelector('svg')).not.toBeNull()
    expect(screen.queryByRole('link', { name: /Volver/ })).not.toBeInTheDocument()
  })

  it('no hay botón de cerrar sesión en la barra superior (está en la pestaña Cuenta)', () => {
    render(<AppShell title="t">x</AppShell>)
    expect(screen.queryByRole('button', { name: /sesión/i })).not.toBeInTheDocument()
  })

  it('vuelve el contenido arriba cuando cambia scrollKey', () => {
    const scrollTo = vi.fn()
    const original = HTMLElement.prototype.scrollTo
    HTMLElement.prototype.scrollTo = scrollTo
    const { rerender } = render(<AppShell title="t" scrollKey={1}>x</AppShell>)
    scrollTo.mockClear()
    rerender(<AppShell title="t" scrollKey={2}>x</AppShell>)
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    HTMLElement.prototype.scrollTo = original
  })
})
