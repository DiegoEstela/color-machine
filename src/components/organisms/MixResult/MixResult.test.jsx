import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
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
// Con estos rojo y azul y sin blanco, un lavanda pastel no se alcanza: la app sugiere sumar blanco.
const darkRed = { id: 'ro', name: 'Rojo', hex: '#c1121f' }
const lavender = '#d9c6ef'
const nobodyHome = [darkRed, azul]

beforeEach(() => {
  useMixStore.getState().reset()
  useRecipesStore.getState().reset()
  Object.values(repo).forEach((fn) => fn.mockReset())
  window.location.hash = ''
})

const ready = () => screen.findByRole('img', { name: /^Tu mezcla #/ }, { timeout: 3000 })
const zones = (container) => container.querySelectorAll('[class*="zone"]')
const renderMix = (props = {}) => render(<MixResult target={target} paints={paints} onAddPaint={() => {}} {...props} />)

describe('MixResult: pantalla compacta', () => {
  it('muestra "Mezclando..." y luego la receta con sus pinturas, partes y calidad', async () => {
    renderMix()
    expect(screen.getByRole('status')).toHaveTextContent('Mezclando...')
    await ready()
    expect(screen.getByText('1 parte')).toBeInTheDocument()
    expect(screen.getByText('2 partes')).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Casi idéntico')
  })

  it('el grupo de receta tiene exactamente dos opciones, en una sola fila, y no existe "Otras"', async () => {
    renderMix()
    await ready()
    const group = screen.getByRole('radiogroup', { name: '¿Qué receta querés ver?' })
    expect(within(group).getAllByRole('radio').map((r) => r.textContent)).toEqual([
      expect.stringMatching(/Recomendada/), expect.stringMatching(/Más exacta/),
    ])
    expect(group.style.getPropertyValue('--columns')).toBe('2')
    expect(screen.queryByRole('radio', { name: /Otras/ })).not.toBeInTheDocument()
  })

  it('no aparecen los textos que se quitaron', async () => {
    renderMix()
    await ready()
    expect(screen.queryByText(/Total:/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Es la misma que la recomendada/)).not.toBeInTheDocument()
    expect(screen.queryByText(/La más simple que queda casi igual/)).not.toBeInTheDocument()
    expect(screen.queryByText(/aunque lleve más partes/)).not.toBeInTheDocument()
    expect(screen.queryByText(/1 parte = la medida/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Es una aproximación/)).not.toBeInTheDocument()
    expect(screen.queryByRole('note', { name: 'Qué es una parte' })).not.toBeInTheDocument()
  })

  it('cambia entre Recomendada y Más exacta sin frase ni aviso', async () => {
    renderMix()
    await ready()
    expect(screen.getByRole('radio', { name: /Recomendada/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: /Más exacta/ }))
    expect(screen.getByRole('radio', { name: /Más exacta/ })).toHaveAttribute('aria-checked', 'true')
    expect(useMixStore.getState().recipeKey).toBe('best')
  })

  it('el grupo de precisión sigue como estaba: subtítulos y la frase de la opción elegida', async () => {
    renderMix()
    await ready()
    expect(screen.getByRole('radio', { name: /Simple.*hasta 6 partes/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Preciso.*hasta 16 partes/ })).toBeInTheDocument()
    expect(screen.getByText('Equilibrio entre facilidad de medir y parecido con tu color.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: /Preciso/ }))
    expect(screen.getByText('El color más parecido posible, pero con más partes para medir.')).toBeInTheDocument()
  })

  it('cada grupo tiene su título y los subtítulos de las dos recetas se mantienen', async () => {
    renderMix()
    await ready()
    expect(screen.getByRole('radiogroup', { name: '¿Qué tan exacta querés la receta?' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Recomendada.*la más simple/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Más exacta.*la que más se parece/ })).toBeInTheDocument()
  })

  it('cambiar la precisión recalcula', async () => {
    renderMix()
    await ready()
    fireEvent.click(screen.getByRole('radio', { name: /Simple/ }))
    expect(useMixStore.getState().maxParts).toBe(6)
    expect(screen.getByRole('status')).toHaveTextContent('Mezclando...')
    await ready()
    expect(screen.getByRole('radio', { name: /Simple/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('la zona del resultado existe una sola vez, igual mientras mezcla y cuando termina', async () => {
    const { container } = renderMix()
    expect(zones(container)).toHaveLength(1)
    await ready()
    expect(zones(container)).toHaveLength(1)
    fireEvent.click(screen.getByRole('radio', { name: /Más exacta/ }))
    expect(zones(container)).toHaveLength(1)
  })

  it('los dos grupos de botones están también mientras mezcla (la pantalla no se reacomoda)', () => {
    renderMix()
    expect(screen.getByRole('radiogroup', { name: '¿Qué receta querés ver?' })).toBeInTheDocument()
    expect(screen.getByRole('radiogroup', { name: '¿Qué tan exacta querés la receta?' })).toBeInTheDocument()
  })

  it('una mezcla que sí alcanza no muestra el aviso de pinturas insuficientes', async () => {
    renderMix()
    await ready()
    expect(screen.queryByRole('note', { name: 'Con estas pinturas no se llega del todo' })).not.toBeInTheDocument()
  })

  it('un resultado de otros datos no se muestra: al cambiar el objetivo vuelve a mezclar', async () => {
    const { rerender } = renderMix()
    await ready()
    rerender(<MixResult target="#2a9d8f" paints={paints} onAddPaint={() => {}} />)
    expect(screen.getByRole('status')).toHaveTextContent('Mezclando...')
    await waitFor(() => expect(screen.getByRole('img', { name: 'Tu color #2a9d8f' })).toBeInTheDocument(), { timeout: 3000 })
  })
})

describe('MixResult: botón ⓘ y hoja informativa', () => {
  it('el botón ⓘ está junto al título de la receta y abre la hoja con las tres notas', async () => {
    renderMix()
    await ready()
    const group = screen.getByRole('radiogroup', { name: '¿Qué receta querés ver?' })
    const info = screen.getByRole('button', { name: 'Cómo leer tu receta' })
    expect(info.closest('[class*="root"]')).toContainElement(group)
    fireEvent.click(info)
    const dialog = screen.getByRole('dialog', { name: 'Cómo leer tu receta' })
    expect(dialog).toHaveTextContent('1 parte = la medida que quieras')
    expect(dialog).toHaveTextContent('Es una aproximación: probá con una cantidad chica antes de mezclar todo.')
    expect(dialog).toHaveTextContent('estándar')
  })

  it('la hoja se cierra con el botón y con Esc', async () => {
    renderMix()
    await ready()
    fireEvent.click(screen.getByRole('button', { name: 'Cómo leer tu receta' }))
    fireEvent.click(screen.getByRole('button', { name: 'Entendido' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cómo leer tu receta' }))
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('también se puede abrir mientras mezcla', () => {
    renderMix()
    fireEvent.click(screen.getByRole('button', { name: 'Cómo leer tu receta' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

describe('MixResult: sumar el color sugerido', () => {
  const mount = async (extra = {}) => {
    const onAddPaint = vi.fn()
    const utils = render(<MixResult target={lavender} paints={nobodyHome} onAddPaint={onAddPaint} {...extra} />)
    await ready()
    return { onAddPaint, ...utils }
  }
  const sumarBlanco = () => screen.findByRole('button', { name: /Sumar Blanco/ }, { timeout: 4000 })

  it('si la receta no alcanza avisa qué falta y ofrece botones "+ Color"', async () => {
    await mount()
    const note = screen.getByRole('note', { name: 'Con estas pinturas no se llega del todo' })
    expect(note).toHaveTextContent(/probá sumar blanco/)
    const button = await sumarBlanco()
    expect(button).toBeEnabled()
    expect(button).toHaveTextContent(/quedaría/)
  })

  it('tocar "+ Blanco" lo suma a la mezcla y recalcula al instante, sin salir del paso 3', async () => {
    await mount()
    const before = useMixStore.getState().result.key
    fireEvent.click(await sumarBlanco())
    expect(useMixStore.getState().extraPaints.map((p) => p.id)).toEqual(['base-blanco'])
    expect(screen.getByRole('status')).toHaveTextContent('Mezclando...') // recalcula
    await screen.findByText('estándar', {}, { timeout: 4000 })
    expect(useMixStore.getState().result.key).not.toBe(before)
    expect(screen.getByRole('img', { name: `Blanco ${blanco.hex}` })).toBeInTheDocument()
  })

  it('al sumar una pintura la lista baja para mostrarla completa', async () => {
    const original = HTMLElement.prototype.scrollTo
    const scrollTo = vi.fn()
    HTMLElement.prototype.scrollTo = scrollTo
    await mount()
    scrollTo.mockClear()
    fireEvent.click(await sumarBlanco())
    await screen.findByText('estándar', {}, { timeout: 4000 })
    await waitFor(() => expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: expect.any(Number) })))
    HTMLElement.prototype.scrollTo = original
  })

  it('la pintura sumada aparece con la etiqueta "estándar" y el resultado mejora', async () => {
    await mount()
    const worse = useMixStore.getState().result.data.best.deltaE
    fireEvent.click(await sumarBlanco())
    await screen.findByText('estándar', {}, { timeout: 4000 })
    await waitFor(() => expect(useMixStore.getState().result.status).toBe('ready'))
    expect(useMixStore.getState().result.data.best.deltaE).toBeLessThan(worse)
  })

  it('no vuelve a ofrecer el color que ya se sumó', async () => {
    await mount()
    fireEvent.click(await sumarBlanco())
    await screen.findByText('estándar', {}, { timeout: 4000 })
    await new Promise((r) => setTimeout(r, 300))
    expect(screen.queryByRole('button', { name: /Sumar Blanco/ })).not.toBeInTheDocument()
  })

  it('una pintura sumada se quita con la ✕ y la sugerencia vuelve', async () => {
    await mount()
    fireEvent.click(await sumarBlanco())
    fireEvent.click(await screen.findByRole('button', { name: 'Quitar Blanco' }, { timeout: 4000 }))
    expect(useMixStore.getState().extraPaints).toEqual([])
    await ready()
    expect(await sumarBlanco()).toBeInTheDocument()
    expect(screen.queryByText('estándar')).not.toBeInTheDocument()
  })

  it('"Usar la mía" quita la estándar y abre el alta con ese nombre (avisa con la pintura)', async () => {
    const { onAddPaint } = await mount()
    fireEvent.click(await sumarBlanco())
    fireEvent.click(await screen.findByRole('button', { name: 'Usar la mía' }, { timeout: 4000 }))
    expect(useMixStore.getState().extraPaints).toEqual([])
    expect(onAddPaint).toHaveBeenCalledWith(expect.objectContaining({ id: 'base-blanco', name: 'Blanco' }))
  })

  it('con 6 pinturas entre elegidas y sumadas los botones "+" quedan deshabilitados y se explica por qué', async () => {
    const six = [darkRed, azul, BASE_PAINTS[4], BASE_PAINTS[1], { id: 'x1', name: 'Carmín', hex: '#aa1020' }, { id: 'x2', name: 'Cobalto', hex: '#2040a0' }]
    render(<MixResult target={lavender} paints={six} onAddPaint={() => {}} />)
    await ready()
    expect(await sumarBlanco()).toBeDisabled()
    expect(screen.getByText(/Ya usás 6 pinturas, el máximo por mezcla/)).toBeInTheDocument()
  })

  it('las pinturas sumadas se guardan en la receta con su nombre, color y partes', async () => {
    repo.create.mockResolvedValue({ data: { id: 'n', name: 'Pastel' }, error: null })
    await mount()
    fireEvent.click(await sumarBlanco())
    await screen.findByText('estándar', {}, { timeout: 4000 })
    await waitFor(() => expect(useMixStore.getState().result.status).toBe('ready'))
    fireEvent.click(await screen.findByRole('button', { name: 'Guardar receta' }))
    fireEvent.change(screen.getByLabelText('Nombre de la receta'), { target: { value: 'Pastel' } })
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }))
    await waitFor(() => expect(repo.create).toHaveBeenCalled())
    const { mix } = repo.create.mock.calls[0][0]
    expect(mix.find((m) => m.name === 'Blanco')).toMatchObject({ name: 'Blanco', hex: blanco.hex })
    expect(mix.every((m) => Number.isInteger(m.parts) && m.parts >= 1)).toBe(true)
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
