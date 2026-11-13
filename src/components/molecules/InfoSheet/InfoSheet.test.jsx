import { act, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InfoSheet } from '../index.js'
import { resetOwnBack } from './historyGuard.js'

// jsdom recorre el historial de forma asíncrona: se deja asentar lo que dejó el test anterior.
beforeEach(async () => {
  await act(async () => { await new Promise((r) => setTimeout(r, 40)) })
  resetOwnBack()
})

function setup(props = {}) {
  const onClose = vi.fn()
  const utils = render(
    <>
      <button>abrir</button>
      <InfoSheet open title="Cómo leer tu receta" onClose={onClose} {...props}>
        <p>1 parte = la medida que quieras.</p>
        <button>enlace dentro</button>
      </InfoSheet>
    </>,
  )
  return { onClose, ...utils }
}

describe('InfoSheet', () => {
  it('es un diálogo modal con título y contenido, fuera del contenedor de la pantalla', () => {
    setup()
    const dialog = screen.getByRole('dialog', { name: 'Cómo leer tu receta' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveTextContent('1 parte = la medida que quieras.')
    expect(dialog.closest('body')).toBe(document.body)
  })

  it('cerrada no muestra nada', () => {
    render(<InfoSheet open={false} title="x" onClose={() => {}}>contenido</InfoSheet>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('el botón "Entendido" la cierra', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('un toque afuera (sobre el fondo atenuado) la cierra, pero uno adentro no', () => {
    const { onClose } = setup()
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
    fireEvent.click(screen.getByTestId('sheet-scrim'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('la tecla Esc la cierra', () => {
    const { onClose } = setup()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('el botón Atrás del teléfono (popstate) la cierra', async () => {
    const { onClose } = setup()
    await act(async () => { window.history.back() })
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })

  it('al abrir lleva el foco a la hoja y al cerrar lo devuelve a quien la abrió', () => {
    const { rerender } = render(<button>abrir</button>)
    const opener = screen.getByRole('button', { name: 'abrir' })
    opener.focus()
    rerender(
      <>
        <button>abrir</button>
        <InfoSheet open title="t" onClose={() => {}}>texto</InfoSheet>
      </>,
    )
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement)
    rerender(<><button>abrir</button><InfoSheet open={false} title="t" onClose={() => {}}>texto</InfoSheet></>)
    expect(opener).toHaveFocus()
  })

  it('el foco queda atrapado: Tab desde el último elemento vuelve al primero y Mayús+Tab al revés', () => {
    setup()
    const inside = screen.getByRole('button', { name: 'enlace dentro' })
    const last = screen.getByRole('button', { name: 'Entendido' })
    last.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(inside).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(last).toHaveFocus()
  })

  it('cerrarla por el botón no deja entradas sobrantes en el historial', async () => {
    const { rerender } = render(<InfoSheet open title="t" onClose={() => {}}>x</InfoSheet>)
    const pushed = window.history.state?.infoSheet
    expect(pushed).toBeDefined()
    rerender(<InfoSheet open={false} title="t" onClose={() => {}}>x</InfoSheet>)
    await act(async () => { await new Promise((r) => setTimeout(r, 40)) })
    // la entrada que agregó la hoja se deshizo con history.back(): ya no es la activa
    expect(window.history.state?.infoSheet).not.toBe(pushed)
  })

  it('funciona aunque history.state devuelva una copia (como en los navegadores)', async () => {
    const stateDescriptor = Object.getOwnPropertyDescriptor(History.prototype, 'state')
    const spy = vi.spyOn(History.prototype, 'state', 'get').mockImplementation(function () {
      return structuredClone(stateDescriptor.get.call(this))
    })
    const back = vi.spyOn(window.history, 'back')
    const { rerender } = render(<InfoSheet open title="t" onClose={() => {}}>x</InfoSheet>)
    rerender(<InfoSheet open={false} title="t" onClose={() => {}}>x</InfoSheet>)
    expect(back).toHaveBeenCalledTimes(1) // deshizo su entrada del historial
    spy.mockRestore()
    back.mockRestore()
  })
})
