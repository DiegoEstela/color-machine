import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach } from 'vitest'
import { useNavigationStore } from '../../../features/navigation/navigationStore.js'
import { useOnboardingStore } from '../../../features/onboarding/onboardingStore.js'
import { AppShell } from '../index.js'

afterEach(() => {
  useNavigationStore.setState({ drawerOpen: false })
  useOnboardingStore.getState().reset()
})

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

  it('con `back` muestra una flecha accesible en lugar del botón de menú', () => {
    render(<AppShell title="Receta" back={{ href: '#/recetas', label: 'Volver a mis recetas' }}>x</AppShell>)
    const back = screen.getByRole('link', { name: 'Volver a mis recetas' })
    expect(back).toHaveAttribute('href', '#/recetas')
    expect(screen.getByRole('banner').querySelectorAll('svg')).toHaveLength(1) // solo la flecha
    expect(screen.queryByRole('button', { name: 'Abrir menú' })).not.toBeInTheDocument()
  })

  it('sin `back` muestra el botón ☰ y no una flecha', () => {
    render(<AppShell title="t">x</AppShell>)
    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.queryByRole('link', { name: /Volver/ })).not.toBeInTheDocument()
  })

  it('☰ abre el menú lateral con Mis pinturas y lo cierra con Esc', () => {
    render(<AppShell title="t">x</AppShell>)
    expect(screen.queryByRole('dialog', { name: 'Menú' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    expect(screen.getByRole('dialog', { name: 'Menú' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Mis pinturas' })).toHaveAttribute('href', '#/pinturas')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Menú' })).not.toBeInTheDocument()
  })

  it('deslizar desde el borde izquierdo abre el menú', () => {
    render(<AppShell title="t">x</AppShell>)
    const p = (x, y) => ({ identifier: 1, clientX: x, clientY: y })
    fireEvent.touchStart(document.body, { touches: [p(3, 300)], changedTouches: [p(3, 300)] })
    act(() => { fireEvent.touchEnd(document.body, { touches: [], changedTouches: [p(120, 305)] }) })
    expect(screen.getByRole('dialog', { name: 'Menú' })).toBeInTheDocument()
  })

  it('no hay botón de cerrar sesión en la barra superior (está en la pestaña Cuenta)', () => {
    render(<AppShell title="t">x</AppShell>)
    expect(screen.queryByRole('button', { name: /sesión/i })).not.toBeInTheDocument()
  })

  it('tiene un degradé decorativo de "hay más abajo", oculto si el contenido entra entero', () => {
    render(<AppShell title="t">x</AppShell>)
    const fade = screen.getByTestId('scroll-fade')
    expect(fade).toHaveAttribute('aria-hidden', 'true')
    expect(fade).not.toHaveAttribute('data-visible') // jsdom mide 0: no hay nada más abajo
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

  it('siempre hay un botón de ayuda "?" y abre la ayuda de la pantalla actual', () => {
    render(<AppShell title="t">x</AppShell>)
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }))
    expect(screen.getByRole('dialog', { name: /^Ayuda: / })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver el recorrido completo' })).toBeInTheDocument()
  })

  it('desde la ayuda se pasa al recorrido completo (con "Omitir" y los pasos)', () => {
    render(<AppShell title="t">x</AppShell>)
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ver el recorrido completo' }))
    expect(screen.getByRole('dialog', { name: 'Recorrido de bienvenida' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent(/^Paso 1 de [78]$/)
    expect(screen.getByRole('button', { name: 'Omitir' })).toBeInTheDocument()
  })

  it('el menú ☰ tiene "Ayuda" y abre la ayuda', async () => {
    render(<AppShell title="t">x</AppShell>)
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }))
    await act(async () => { fireEvent.click(within(screen.getByRole('dialog', { name: 'Menú' })).getByRole('button', { name: 'Ayuda' })) })
    expect(await screen.findByRole('dialog', { name: /^Ayuda: / })).toBeInTheDocument()
  })

  it('con el recorrido abierto, deslizar desde el borde no abre el menú', () => {
    useOnboardingStore.getState().startTour()
    render(<AppShell title="t">x</AppShell>)
    const p = (x, y) => ({ identifier: 1, clientX: x, clientY: y })
    fireEvent.touchStart(document.body, { touches: [p(3, 300)], changedTouches: [p(3, 300)] })
    act(() => { fireEvent.touchEnd(document.body, { touches: [], changedTouches: [p(120, 305)] }) })
    expect(screen.queryByRole('dialog', { name: 'Menú' })).not.toBeInTheDocument()
  })
})
