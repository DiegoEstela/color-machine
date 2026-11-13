import { render, screen, fireEvent } from '@testing-library/react'
import Create from './Create.jsx'
import { useMixStore } from '../../features/color-mixer/mixStore.js'
import { usePaintsStore } from '../../features/paints/paintsStore.js'

const repo = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('../../features/storage/paintsRepo.js', () => ({ paintsRepo: repo }))

beforeEach(() => {
  useMixStore.getState().reset()
  usePaintsStore.getState().reset()
  repo.list.mockResolvedValue({
    data: [{ id: 'a', name: 'Rojo', hex: '#ff0000' }, { id: 'b', name: 'Azul', hex: '#0000ff' }],
    error: null,
  })
})

describe('Create', () => {
  it('flujo completo: color → pinturas → mezcla, y volver conservando todo', async () => {
    render(<Create />)
    // Paso 1
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Color (hex)'), { target: { value: '#e63946' } })
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    // Paso 2: referencia del objetivo, pinturas del usuario y selección
    expect(screen.getByText('Paso 2 de 3')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Color objetivo #e63946' })).toBeInTheDocument()
    fireEvent.click(await screen.findByRole('button', { name: 'Rojo #ff0000' }))
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled() // falta una
    fireEvent.click(screen.getByRole('button', { name: 'Azul #0000ff' }))
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    // Paso 3: calcula y muestra la receta
    expect(screen.getByText('Paso 3 de 3')).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: /^Tu mezcla #/ }, { timeout: 3000 })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tu color #e63946' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: '¿Qué receta querés ver?' })).toBeInTheDocument()
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument()

    // Volver dos veces conserva el color objetivo
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(screen.getByLabelText('Color (hex)')).toHaveValue('#e63946')
  })
})
