import { render, screen, fireEvent } from '@testing-library/react'
import App from './App.jsx'

const signOut = vi.hoisted(() => vi.fn())

// Sesión iniciada, sin tocar Supabase.
vi.mock('./features/auth/index.js', () => {
  const state = { status: 'signedIn', recovering: false, init: () => () => {} }
  return {
    useAuthStore: (selector) => selector(state),
    authService: { signOut },
  }
})
vi.mock('./features/storage/paintsRepo.js', () => ({ paintsRepo: { list: vi.fn().mockResolvedValue({ data: [], error: null }) } }))

describe('App con sesión iniciada', () => {
  it('ya no tiene la barra superior con el botón "Salir" de texto', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument()
    expect(screen.queryByText('Color Machine')).not.toBeInTheDocument()
  })

  it('cierra sesión desde el botón de ícono', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })
})
