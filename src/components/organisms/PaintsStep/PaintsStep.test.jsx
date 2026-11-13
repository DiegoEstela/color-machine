import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PaintsStep } from '../index.js'
import { usePaintsStore } from '../../../features/paints/paintsStore.js'

const repo = vi.hoisted(() => ({ list: vi.fn(), create: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('../../../features/storage/paintsRepo.js', () => ({ paintsRepo: repo }))

const P = (i) => ({ id: `p${i}`, name: `Pintura ${i}`, hex: '#ff0000' })

beforeEach(() => {
  usePaintsStore.getState().reset()
  Object.values(repo).forEach((fn) => fn.mockReset())
})

const open = async (n) => {
  repo.list.mockResolvedValue({ data: Array.from({ length: n }, (_, i) => P(i + 1)), error: null })
  const props = { onBack: vi.fn(), onNext: vi.fn() }
  render(<PaintsStep {...props} />)
  await screen.findByRole('button', { name: /Pintura 1 / })
  return props
}
const pick = (i) => fireEvent.click(screen.getByRole('button', { name: new RegExp(`Pintura ${i} `) }))

describe('PaintsStep', () => {
  it('carga las pinturas y exige entre 2 y 6 seleccionadas para continuar', async () => {
    const { onNext } = await open(3)
    const next = screen.getByRole('button', { name: 'Siguiente' })
    expect(next).toBeDisabled()
    pick(1)
    expect(next).toBeDisabled()
    pick(2)
    expect(next).toBeEnabled()
    fireEvent.click(next)
    expect(onNext).toHaveBeenCalled()
  })

  it('no deja seleccionar más de 6 y avisa', async () => {
    await open(7)
    for (let i = 1; i <= 7; i++) pick(i)
    expect(screen.getByText('Elegidas: 6 de 6')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Máximo 6')
    expect(screen.getByRole('button', { name: /Pintura 7 / })).toHaveAttribute('aria-pressed', 'false')
  })

  it('Volver llama onBack', async () => {
    const { onBack } = await open(1)
    fireEvent.click(screen.getByRole('button', { name: 'Volver' }))
    expect(onBack).toHaveBeenCalled()
  })

  it('agrega una pintura nueva y vuelve a la lista', async () => {
    await open(1)
    repo.create.mockResolvedValue({ data: { id: 'n', name: 'Azul', hex: '#0000ff' }, error: null })
    fireEvent.click(screen.getByRole('button', { name: 'Agregar pintura' }))
    fireEvent.change(screen.getByLabelText('Nombre'), { target: { value: 'Azul' } })
    fireEvent.change(screen.getByLabelText('Color (hex)'), { target: { value: '#0000ff' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar pintura' }))
    await waitFor(() => expect(repo.create).toHaveBeenCalledWith({ name: 'Azul', hex: '#0000ff' }))
    expect(await screen.findByRole('button', { name: 'Azul #0000ff' })).toBeInTheDocument()
  })

  it('muestra el error de carga y permite reintentar', async () => {
    repo.list.mockResolvedValueOnce({ data: null, error: { message: 'Sin conexión' } })
    render(<PaintsStep onBack={() => {}} onNext={() => {}} />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión')
    repo.list.mockResolvedValueOnce({ data: [P(1)], error: null })
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(await screen.findByRole('button', { name: /Pintura 1 / })).toBeInTheDocument()
  })
})
