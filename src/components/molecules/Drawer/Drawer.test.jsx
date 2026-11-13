import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetOwnBack } from '../InfoSheet/historyGuard.js'
import { Drawer } from '../index.js'

const SECTIONS = [
  { id: 'main', title: null, items: [
    { id: 'paints', label: 'Mis pinturas', icon: 'jar', href: '#/pinturas' },
    { id: 'library', label: 'Recetas', icon: 'book', href: '#/recetas' },
  ] },
  { id: 'tools', title: null, items: [{ id: 'help', label: 'Ayuda', icon: 'help', action: 'help' }] },
  { id: 'soon', title: 'Próximamente', items: [{ id: 'q', label: 'Calculador', icon: 'drop', disabled: true }] },
]

beforeEach(resetOwnBack)
afterEach(() => { window.location.hash = ''; resetOwnBack() })

describe('Drawer', () => {
  it('cerrado no muestra nada', () => {
    render(<Drawer open={false} onClose={() => {}} sections={SECTIONS} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('abierto es un diálogo modal con los enlaces del menú y el email', () => {
    render(<Drawer open onClose={() => {}} sections={SECTIONS} email="a@b.com" activeId="library" />)
    expect(screen.getByRole('dialog', { name: 'Menú' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('link', { name: 'Mis pinturas' })).toHaveAttribute('href', '#/pinturas')
    expect(screen.getByRole('link', { name: 'Recetas' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByText('a@b.com')).toBeInTheDocument()
  })

  it('los ítems próximamente no son enlaces y están deshabilitados', () => {
    render(<Drawer open onClose={() => {}} sections={SECTIONS} />)
    expect(screen.queryByRole('link', { name: 'Calculador' })).not.toBeInTheDocument()
    expect(screen.getByText('Calculador').closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('heading', { name: 'Próximamente' })).toBeInTheDocument()
  })

  it('pone el foco en el primer enlace y lo devuelve al cerrar', () => {
    const trigger = document.createElement('button')
    document.body.append(trigger)
    trigger.focus()
    const { rerender } = render(<Drawer open onClose={() => {}} sections={SECTIONS} />)
    expect(screen.getByRole('link', { name: 'Mis pinturas' })).toHaveFocus()
    rerender(<Drawer open={false} onClose={() => {}} sections={SECTIONS} />)
    expect(trigger).toHaveFocus()
    trigger.remove()
  })

  it('se cierra con Esc y con un toque en el fondo, pero no al tocar el panel', () => {
    const onClose = vi.fn()
    render(<Drawer open onClose={onClose} sections={SECTIONS} />)
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByTestId('drawer-scrim'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  it('el botón Atrás del teléfono lo cierra', async () => {
    const onClose = vi.fn()
    render(<Drawer open onClose={onClose} sections={SECTIONS} />)
    await act(async () => { window.history.back() })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('arrastrar el panel hacia la izquierda lo cierra al soltar; un arrastre corto no', () => {
    const onClose = vi.fn()
    render(<Drawer open onClose={onClose} sections={SECTIONS} />)
    const panel = screen.getByRole('dialog')
    fireEvent.pointerDown(panel, { pointerId: 1, clientX: 200 })
    fireEvent.pointerMove(panel, { pointerId: 1, clientX: 180 })
    fireEvent.pointerUp(panel, { pointerId: 1, clientX: 180 })
    expect(onClose).not.toHaveBeenCalled()
    expect(panel.style.transform).toBe('')
    fireEvent.pointerDown(panel, { pointerId: 2, clientX: 200 })
    fireEvent.pointerMove(panel, { pointerId: 2, clientX: 100 })
    expect(panel.style.transform).toBe('translateX(-100px)')
    fireEvent.pointerUp(panel, { pointerId: 2, clientX: 100 })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('elegir un ítem cierra el menú y después navega', async () => {
    function Wrapper() {
      const [open, setOpen] = useState(true)
      return <Drawer open={open} onClose={() => setOpen(false)} sections={SECTIONS} />
    }
    render(<Wrapper />)
    fireEvent.click(screen.getByRole('link', { name: 'Mis pinturas' }))
    await waitFor(() => expect(window.location.hash).toBe('#/pinturas'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('un ítem con acción es un botón: cierra el menú y después ejecuta la acción', async () => {
    const onAction = vi.fn()
    function Wrapper() {
      const [open, setOpen] = useState(true)
      return <Drawer open={open} onClose={() => setOpen(false)} sections={SECTIONS} onAction={onAction} />
    }
    render(<Wrapper />)
    expect(screen.queryByRole('link', { name: 'Ayuda' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await waitFor(() => expect(onAction).toHaveBeenCalledWith(expect.objectContaining({ id: 'help', action: 'help' })))
  })
})
