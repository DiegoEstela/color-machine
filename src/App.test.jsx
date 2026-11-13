import { act, render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import App from './App.jsx'
import { useMixStore } from './features/color-mixer/mixStore.js'
import { usePaintsStore } from './features/paints/paintsStore.js'
import { useRecipesStore } from './features/recipes/recipesStore.js'

const signOut = vi.hoisted(() => vi.fn())
const authState = vi.hoisted(() => ({ status: 'signedIn', recovering: false, user: { email: 'diego@example.com' }, init: () => () => {} }))
const repos = vi.hoisted(() => ({
  recipes: { list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
  paints: { list: vi.fn().mockResolvedValue({ data: [], error: null }), create: vi.fn(), update: vi.fn(), remove: vi.fn() },
}))

// Sesión simulada, sin tocar Supabase.
vi.mock('./features/auth/index.js', () => ({
  useAuthStore: (selector) => selector(authState),
  authService: { signOut },
}))
vi.mock('./features/storage/recipesRepo.js', () => ({ recipesRepo: repos.recipes }))
vi.mock('./features/storage/paintsRepo.js', () => ({ paintsRepo: repos.paints }))

const RECIPES = [
  {
    id: 'r1', name: 'Violeta suave', target_hex: '#5b2a86', result_hex: '#583087',
    mix: [{ name: 'Rojo', hex: '#e4002b', parts: 2 }, { name: 'Azul', hex: '#1d3fbb', parts: 1 }],
    created_at: '2026-11-14T12:00:00Z',
  },
  {
    id: 'r2', name: 'Verde bosque', target_hex: '#2a9d8f', result_hex: '#2b9a8c',
    mix: [{ name: 'Amarillo', hex: '#fcd116', parts: 1 }, { name: 'Azul', hex: '#1d3fbb', parts: 3 }],
    created_at: '2026-11-13T12:00:00Z',
  },
]

const go = async (hash) => {
  await act(async () => {
    window.location.hash = hash
    window.dispatchEvent(new HashChangeEvent('hashchange'))
  })
}

beforeEach(() => {
  authState.status = 'signedIn'
  authState.recovering = false
  signOut.mockClear()
  useMixStore.getState().reset()
  usePaintsStore.getState().reset()
  useRecipesStore.getState().reset()
  Object.values(repos.recipes).forEach((fn) => fn.mockReset())
  repos.recipes.list.mockResolvedValue({ data: RECIPES, error: null })
  window.location.hash = ''
})

describe('App: estructura de app', () => {
  it('con sesión abre en Crear, con barra superior, contenido y barra de pestañas', () => {
    render(<App />)
    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('heading', { name: 'Elegí tu color' }))
    expect(screen.getByRole('navigation', { name: 'Navegación principal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Crear' })).toHaveAttribute('aria-current', 'page')
  })

  it('ya no hay botón "Salir" ni ícono de cerrar sesión en la barra superior', () => {
    render(<App />)
    expect(screen.queryByRole('button', { name: 'Salir' })).not.toBeInTheDocument()
    // el único botón de la barra superior es el ☰ del menú lateral
    expect(within(screen.getByRole('banner')).getAllByRole('button').map((b) => b.getAttribute('aria-label'))).toEqual(['Abrir menú'])
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })

  it('la ruta #/pinturas muestra Mis pinturas sin pestaña activa', () => {
    window.location.hash = '#/pinturas'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Mis pinturas' })).toBeInTheDocument()
  })

  it('la pantalla de acceso (sin sesión) no lleva barra de pestañas', () => {
    authState.status = 'signedOut'
    render(<App />)
    expect(screen.queryByRole('navigation', { name: 'Navegación principal' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Color Machine' })).toBeInTheDocument()
  })
})

describe('App: pestañas y rutas', () => {
  it('#/cuenta muestra el email y cierra la sesión', async () => {
    window.location.hash = '#/cuenta'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Cuenta' })).toBeInTheDocument()
    expect(screen.getByText('diego@example.com')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Cuenta' })).toHaveAttribute('aria-current', 'page')
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar sesión' }))
    expect(signOut).toHaveBeenCalledTimes(1)
  })

  it('#/recetas abre la biblioteca con las recetas, la más nueva primero', async () => {
    window.location.hash = '#/recetas'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Mis recetas' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Violeta suave/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Verde bosque/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Recetas' })).toHaveAttribute('aria-current', 'page')
  })

  it('abrir #/recetas/<id> directo muestra el detalle (carga las recetas si hace falta)', async () => {
    window.location.hash = '#/recetas/r2'
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Verde bosque', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Recetas' })).toHaveAttribute('aria-current', 'page') // el detalle cuenta como Recetas
    expect(screen.getByRole('link', { name: 'Volver a mis recetas' })).toHaveAttribute('href', '#/recetas')
    expect(screen.getByRole('button', { name: 'Mezclar este color otra vez' })).toBeInTheDocument()
  })

  it('un id inexistente muestra un aviso y una salida', async () => {
    window.location.hash = '#/recetas/nope'
    render(<App />)
    expect(await screen.findByText(/No encontramos esta receta/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ver mis recetas' }))
    await waitFor(() => expect(window.location.hash).toBe('#/recetas'))
  })

  it('tocar una receta de la biblioteca abre su detalle', async () => {
    window.location.hash = '#/recetas'
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: /Violeta suave/ }))
    expect(window.location.hash).toBe('#/recetas/r1')
    await go('#/recetas/r1')
    expect(await screen.findByRole('heading', { name: 'Violeta suave', level: 2 })).toBeInTheDocument()
  })

  it('"Mezclar este color otra vez" usa el color como objetivo y va al paso 2 de Crear', async () => {
    window.location.hash = '#/recetas/r1'
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Mezclar este color otra vez' }))
    expect(window.location.hash).toBe('#/')
    expect(useMixStore.getState()).toMatchObject({ targetColor: '#5b2a86', step: 2 })
    await go('#/')
    expect(await screen.findByRole('heading', { name: 'Tus pinturas' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Color objetivo #5b2a86' })).toBeInTheDocument()
  })

  it('borrar una receta desde el detalle vuelve a la biblioteca', async () => {
    repos.recipes.remove.mockResolvedValue({ data: null, error: null })
    window.location.hash = '#/recetas/r1'
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Borrar' }))
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))
    await waitFor(() => expect(repos.recipes.remove).toHaveBeenCalledWith('r1'))
    await waitFor(() => expect(window.location.hash).toBe('#/recetas'))
    expect(useRecipesStore.getState().recipes.map((r) => r.id)).toEqual(['r2'])
  })

  it('cambiar de pestaña no pierde lo que se estaba creando', async () => {
    useMixStore.setState({ targetColor: '#e63946' })
    render(<App />)
    expect(screen.getByLabelText('Color (hex)')).toHaveValue('#e63946')
    await go('#/recetas')
    expect(screen.getByRole('heading', { name: 'Mis recetas' })).toBeInTheDocument()
    await go('#/cuenta')
    await go('#/')
    expect(screen.getByLabelText('Color (hex)')).toHaveValue('#e63946')
    expect(useMixStore.getState().step).toBe(1)
  })

  it('el botón Atrás (cambio de hash) vuelve entre pantallas', async () => {
    window.location.hash = '#/recetas'
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Mis recetas' })).toBeInTheDocument()
    await go('#/cuenta')
    expect(screen.getByRole('heading', { name: 'Cuenta' })).toBeInTheDocument()
    await go('#/recetas')
    expect(screen.getByRole('heading', { name: 'Mis recetas' })).toBeInTheDocument()
  })

  it('un error de red al cargar la biblioteca se muestra en español con "Reintentar"', async () => {
    repos.recipes.list.mockResolvedValueOnce({ data: null, error: { code: 'offline', message: 'Sin conexión. Revisá tu internet y volvé a intentar.' } })
    window.location.hash = '#/recetas'
    render(<App />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión')
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('button', { name: /Violeta suave/ })).toBeInTheDocument()
  })

  it('biblioteca vacía: invita a crear una mezcla', async () => {
    repos.recipes.list.mockResolvedValue({ data: [], error: null })
    window.location.hash = '#/recetas'
    render(<App />)
    fireEvent.click(await screen.findByRole('button', { name: 'Crear una mezcla' }))
    expect(window.location.hash).toBe('#/')
  })
})
