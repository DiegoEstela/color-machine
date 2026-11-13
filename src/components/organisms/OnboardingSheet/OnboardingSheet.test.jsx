import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resetOwnBack } from '../../molecules/InfoSheet/historyGuard.js'
import { OnboardingSheet } from '../index.js'

const cards = [
  { id: 'a', art: 'welcome', title: 'Primera', body: ['Texto uno.'] },
  { id: 'b', art: 'color', title: 'Segunda', body: ['Texto dos.', 'Más texto.'] },
  { id: 'c', art: 'mix', title: 'Tercera', body: ['Texto tres.'] },
]
const settle = () => new Promise((r) => setTimeout(r, 30))
const point = (x, y) => ({ identifier: 1, clientX: x, clientY: y })

function Harness({ mode = 'tour', onClose = () => {}, onShowTour = () => {}, start = 0, list = cards }) {
  const [index, setIndex] = useState(start)
  return <OnboardingSheet open mode={mode} cards={list} index={index} onIndex={(i) => setIndex(Math.max(0, Math.min(list.length - 1, i)))} onClose={onClose} onShowTour={onShowTour} />
}

beforeEach(async () => { await settle(); resetOwnBack() })
afterEach(async () => { await settle(); resetOwnBack() })

describe('OnboardingSheet: recorrido', () => {
  it('es un diálogo modal con el paso, el título y el texto de la tarjeta', () => {
    render(<Harness />)
    expect(screen.getByRole('dialog', { name: 'Recorrido de bienvenida' })).toHaveAttribute('aria-modal', 'true')
    expect(screen.getByRole('heading', { name: 'Primera' })).toBeInTheDocument()
    expect(screen.getByText('Texto uno.')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Paso 1 de 3')
  })

  it('el foco arranca en el botón principal', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toHaveFocus()
  })

  it('Siguiente y Atrás recorren las tarjetas; en la primera Atrás está deshabilitado', () => {
    render(<Harness />)
    expect(screen.getByRole('button', { name: 'Atrás' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByRole('heading', { name: 'Segunda' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Paso 2 de 3')
    fireEvent.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByRole('heading', { name: 'Primera' })).toBeInTheDocument()
  })

  it('en la última tarjeta el botón es "¡Empezar!" y cierra', () => {
    const onClose = vi.fn()
    render(<Harness start={2} onClose={onClose} />)
    expect(screen.queryByRole('button', { name: 'Siguiente' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '¡Empezar!' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('Omitir cierra desde cualquier tarjeta', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Omitir' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('las flechas del teclado cambian de tarjeta y Esc cierra', () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    fireEvent.keyDown(document, { key: 'ArrowRight' })
    expect(screen.getByRole('heading', { name: 'Segunda' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'ArrowLeft' })
    expect(screen.getByRole('heading', { name: 'Primera' })).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('deslizar hacia la izquierda avanza y hacia la derecha retrocede; un gesto corto o vertical no hace nada', () => {
    render(<Harness />)
    const dialog = screen.getByRole('dialog')
    const swipe = (from, to) => {
      fireEvent.touchStart(dialog, { touches: [point(...from)] })
      fireEvent.touchEnd(dialog, { changedTouches: [point(...to)] })
    }
    swipe([250, 300], [100, 305])
    expect(screen.getByRole('heading', { name: 'Segunda' })).toBeInTheDocument()
    swipe([100, 300], [130, 300]) // corto
    swipe([200, 200], [205, 400]) // vertical
    expect(screen.getByRole('heading', { name: 'Segunda' })).toBeInTheDocument()
    swipe([100, 300], [250, 300])
    expect(screen.getByRole('heading', { name: 'Primera' })).toBeInTheDocument()
  })

  it('el botón Atrás del teléfono lo cierra', async () => {
    const onClose = vi.fn()
    render(<Harness onClose={onClose} />)
    await act(async () => { window.history.back() })
    await waitFor(() => expect(onClose).toHaveBeenCalled())
  })

  it('el foco queda atrapado: Tab desde el último botón vuelve al primero', () => {
    render(<Harness />)
    const buttons = screen.getAllByRole('button')
    buttons.at(-1).focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(buttons[0]).toHaveFocus()
  })

  it('las ilustraciones y los puntos son decorativos', () => {
    const { baseElement } = render(<Harness />)
    expect(baseElement.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThan(1)
  })
})

describe('OnboardingSheet: ayuda de una pantalla', () => {
  const one = [cards[1]]
  it('muestra una sola tarjeta con "Ver el recorrido completo" y "Entendido"', () => {
    const onShowTour = vi.fn()
    const onClose = vi.fn()
    render(<Harness mode="context" list={one} onShowTour={onShowTour} onClose={onClose} />)
    expect(screen.getByRole('dialog', { name: 'Ayuda: Segunda' })).toBeInTheDocument()
    expect(screen.queryByText(/Paso 1 de/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver el recorrido completo' }))
    expect(onShowTour).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(onClose).toHaveBeenCalled()
  })
  it('deslizar no cambia nada (hay una sola tarjeta)', () => {
    render(<Harness mode="context" list={one} />)
    const dialog = screen.getByRole('dialog')
    fireEvent.touchStart(dialog, { touches: [point(250, 300)] })
    fireEvent.touchEnd(dialog, { changedTouches: [point(100, 300)] })
    expect(screen.getByRole('heading', { name: 'Segunda' })).toBeInTheDocument()
  })
})

describe('OnboardingSheet: cerrado', () => {
  it('no muestra nada', () => {
    render(<OnboardingSheet open={false} mode="tour" cards={cards} index={0} onIndex={() => {}} onClose={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
