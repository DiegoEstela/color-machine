import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRecipesStore } from '../../../features/recipes/recipesStore.js'
import { MixResult } from '../index.js'
import { useMixStore } from '../../../features/color-mixer/mixStore.js'
import { mixHex } from '../../../features/color-mixer/mixer.js'
import { BASE_PAINTS } from '../../../features/color-mixer/referencePaints.js'

const repo = vi.hoisted(() => ({ create: vi.fn(), list: vi.fn(), update: vi.fn(), remove: vi.fn() }))
vi.mock('../../../features/storage/recipesRepo.js', () => ({ recipesRepo: repo }))

const [rojo, , azul, blanco] = BASE_PAINTS
const paints = [rojo, azul]
const target = mixHex([{ hex: rojo.hex, parts: 1 }, { hex: azul.hex, parts: 2 }])

beforeEach(() => {
  useMixStore.getState().reset()
  useRecipesStore.getState().reset()
  Object.values(repo).forEach((fn) => fn.mockReset())
  window.location.hash = ''
})

const ready = () => screen.findByRole('img', { name: /^Tu mezcla #/ }, { timeout: 3000 })

describe('MixResult', () => {
  it('muestra "Mezclando..." y luego la receta con partes y calidad', async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('Mezclando...')
    await ready()
    expect(screen.getByText('1 parte')).toBeInTheDocument()
    expect(screen.getByText('2 partes')).toBeInTheDocument()
    expect(screen.getByText('Total: 3 partes en total')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Casi idéntico')
    expect(screen.getByText(/aproximación/)).toBeInTheDocument()
  })

  it('una mezcla que sí alcanza no muestra avisos de pinturas insuficientes', async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    expect(screen.queryByRole('note', { name: 'Con estas pinturas no se llega del todo' })).not.toBeInTheDocument()
  })

  it('cambia entre Recomendada y Más exacta', async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    expect(screen.getByRole('radio', { name: /Recomendada/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: /Más exacta/ }))
    expect(screen.getByRole('radio', { name: /Más exacta/ })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Es la misma que la recomendada.')).toBeInTheDocument()
  })

  it('cada grupo de botones tiene un título que explica qué elige', async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    expect(screen.getByRole('radiogroup', { name: '¿Qué tan exacta querés la receta?' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: '¿Qué receta querés ver?' })).toBeInTheDocument()
  })

  it('las opciones de precisión muestran su subtítulo y la frase de la elegida', async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    expect(screen.getByRole('radio', { name: /Simple.*hasta 6 partes/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Preciso.*hasta 16 partes/ })).toBeInTheDocument()
    expect(screen.getByText('Equilibrio entre facilidad de medir y parecido con tu color.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /Preciso/ }))
    expect(screen.getByText('El color más parecido posible, pero con más partes para medir.')).toBeInTheDocument()
  })

  it('las opciones de receta explican qué es cada una', async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    expect(screen.getByText('La más simple que queda casi igual de cerca que la mejor.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /Más exacta/ }))
    expect(screen.getByText('La que más se acerca a tu color, aunque lleve más partes.')).toBeInTheDocument()
  })

  it('explica qué es una parte y no muestra el ΔE a la vista', async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    expect(screen.getByRole('note', { name: 'Qué es una parte' })).toHaveTextContent('1 parte = la medida que quieras')
    expect(screen.getByText(/ΔE/).className).toMatch(/hidden/)
  })

  it('cambiar la precisión recalcula', async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    expect(screen.getByRole('radio', { name: /Normal/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: /Simple/ }))
    expect(useMixStore.getState().maxParts).toBe(6)
    expect(screen.getByRole('status')).toHaveTextContent('Mezclando...')
    await ready()
    expect(screen.getByRole('radio', { name: /Simple/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('si las pinturas no alcanzan avisa y ofrece sumar blanco', async () => {
    const pastel = mixHex([{ hex: rojo.hex, parts: 1 }, { hex: azul.hex, parts: 1 }, { hex: blanco.hex, parts: 5 }])
    const onAddPaint = vi.fn()
    render(<MixResult target={pastel} paints={paints} onAddPaint={onAddPaint} />)
    await ready()
    const note = screen.getByRole('note', { name: 'Con estas pinturas no se llega del todo' })
    expect(note).toHaveTextContent('probá sumar blanco')
    const add = await screen.findByRole('button', { name: 'Agregar Blanco' }, { timeout: 3000 })
    fireEvent.click(add)
    expect(onAddPaint).toHaveBeenCalledWith(expect.objectContaining({ name: 'Blanco' }))
  })

  it('no muestra un resultado de otros datos: al cambiar el objetivo vuelve a mezclar', async () => {
    const { rerender } = render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    rerender(<MixResult target="#2a9d8f" paints={paints} onAddPaint={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('Mezclando...')
    await waitFor(() => expect(screen.getByRole('img', { name: 'Tu color #2a9d8f' })).toBeInTheDocument(), { timeout: 3000 })
  })
})

describe('MixResult: guardar la receta', () => {
  const open = async () => {
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar receta' }))
  }
  const type = (v) => fireEvent.change(screen.getByLabelText('Nombre de la receta'), { target: { value: v } })

  it('cada receta tiene un botón "Guardar receta" con el nombre vacío', async () => {
    await open()
    expect(screen.getByLabelText('Nombre de la receta')).toHaveValue('')
  })

  it('guarda una copia de la receta mostrada: nombre, colores y partes de cada pintura', async () => {
    repo.create.mockResolvedValue({ data: { id: 'nuevo', name: 'Mi violeta' }, error: null })
    await open()
    type('  Mi violeta ')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(repo.create).toHaveBeenCalledTimes(1))
    const payload = repo.create.mock.calls[0][0]
    expect(payload).toMatchObject({ name: 'Mi violeta', target_hex: target })
    expect(payload.result_hex).toMatch(/^#[0-9a-f]{6}$/)
    expect(payload.mix).toEqual([
      { name: 'Rojo', hex: rojo.hex, parts: 1 },
      { name: 'Azul', hex: azul.hex, parts: 2 },
    ])
    expect(Object.keys(payload).sort()).toEqual(['mix', 'name', 'result_hex', 'target_hex'])
  })

  it('tras guardar muestra la confirmación y el botón queda en "Guardada"', async () => {
    repo.create.mockResolvedValue({ data: { id: 'nuevo', name: 'x' }, error: null })
    await open()
    type('Mi violeta')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('¡Receta guardada!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardada' })).toBeDisabled()
    expect(useRecipesStore.getState().recipes.map((r) => r.id)).toEqual(['nuevo'])
    expect(Object.values(useMixStore.getState().savedRecipes)).toEqual(['nuevo'])
  })

  it('no se puede guardar dos veces la misma receta (la señal persiste al volver a la pantalla)', async () => {
    repo.create.mockResolvedValue({ data: { id: 'nuevo', name: 'x' }, error: null })
    const { unmount } = render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar receta' }))
    type('Una vez')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await screen.findByText('¡Receta guardada!')
    unmount()
    render(<MixResult target={target} paints={paints} onAddPaint={() => {}} />)
    await ready()
    expect(screen.queryByRole('button', { name: 'Guardar receta' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardada' })).toBeDisabled()
    expect(repo.create).toHaveBeenCalledTimes(1)
  })

  it('rechaza el nombre vacío sin llamar a la base', async () => {
    await open()
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(screen.getByText('Ponele un nombre a la receta.')).toBeInTheDocument()
    expect(repo.create).not.toHaveBeenCalled()
  })

  it('un error de la base se muestra en español y permite reintentar', async () => {
    repo.create.mockResolvedValueOnce({ data: null, error: { code: 'offline', message: 'Sin conexión. Revisá tu internet y volvé a intentar.' } })
    await open()
    type('Violeta')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Sin conexión')
    expect(screen.queryByText('¡Receta guardada!')).not.toBeInTheDocument()
    repo.create.mockResolvedValueOnce({ data: { id: 'n2', name: 'Violeta' }, error: null })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    expect(await screen.findByText('¡Receta guardada!')).toBeInTheDocument()
  })

  it('"Ver mis recetas" lleva a la biblioteca', async () => {
    repo.create.mockResolvedValue({ data: { id: 'nuevo', name: 'x' }, error: null })
    await open()
    type('Violeta')
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Ver mis recetas' }))
    expect(window.location.hash).toBe('#/recetas')
  })
})
