import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetOwnBack } from '../components/molecules/InfoSheet/historyGuard.js'
import { useLeaveGuard } from './useLeaveGuard.js'

function Probe({ initial = true }) {
  const [active, setActive] = useState(initial)
  const guard = useLeaveGuard(active)
  return (
    <div>
      <a href="#/recetas">Ir a recetas</a>
      <a href={window.location.hash || '#'}>Esta misma</a>
      <button onClick={() => setActive(false)}>Guardar</button>
      <button onClick={() => guard.leaveTo('#/recetas/x')}>Salir sin preguntar</button>
      <p data-testid="pending">{guard.pending ? guard.pending.type : 'nada'}</p>
      <button onClick={guard.stay}>Quedarme</button>
      <button onClick={guard.leave}>Salir</button>
    </div>
  )
}

// Cambiar el hash dispara un popstate asíncrono: se espera a que pase antes de cada prueba para no mezclar eventos.
const settle = () => new Promise((r) => setTimeout(r, 30))
beforeEach(async () => { window.location.hash = '#/editar'; await settle(); resetOwnBack() })
afterEach(async () => { window.location.hash = ''; await settle(); resetOwnBack() })

describe('useLeaveGuard', () => {
  it('un enlace interno no navega: queda pendiente la pregunta', () => {
    render(<Probe />)
    fireEvent.click(screen.getByRole('link', { name: 'Ir a recetas' }))
    expect(screen.getByTestId('pending')).toHaveTextContent('link')
    expect(window.location.hash).toBe('#/editar')
  })

  it('"Salir" lleva a donde se quería ir y "Quedarme" cierra la pregunta', async () => {
    render(<Probe />)
    fireEvent.click(screen.getByRole('link', { name: 'Ir a recetas' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quedarme' }))
    expect(screen.getByTestId('pending')).toHaveTextContent('nada')
    expect(window.location.hash).toBe('#/editar')
    fireEvent.click(screen.getByRole('link', { name: 'Ir a recetas' }))
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Salir' })) })
    await waitFor(() => expect(window.location.hash).toBe('#/recetas'))
  })

  it('el botón Atrás del teléfono también pregunta', async () => {
    render(<Probe />)
    await act(async () => { window.history.back() })
    await waitFor(() => expect(screen.getByTestId('pending')).toHaveTextContent('back'))
  })

  it('sin cambios (inactivo) no interfiere con los enlaces', () => {
    render(<Probe initial={false} />)
    fireEvent.click(screen.getByRole('link', { name: 'Ir a recetas' }))
    expect(screen.getByTestId('pending')).toHaveTextContent('nada')
  })

  it('al volverse inactivo (se guardó) deja de preguntar', () => {
    render(<Probe />)
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    fireEvent.click(screen.getByRole('link', { name: 'Ir a recetas' }))
    expect(screen.getByTestId('pending')).toHaveTextContent('nada')
  })

  it('leaveTo sale sin preguntar', async () => {
    render(<Probe />)
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Salir sin preguntar' })) })
    await waitFor(() => expect(window.location.hash).toBe('#/recetas/x'))
    expect(screen.getByTestId('pending')).toHaveTextContent('nada')
  })
})
