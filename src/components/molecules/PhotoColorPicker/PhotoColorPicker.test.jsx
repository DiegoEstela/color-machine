import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhotoColorPicker } from '../index.js'
import { loadImageToCanvas } from '../../../lib/image.js'
import { fakeCanvasContext, finger, mockFrameRect, mockStageSize, viewportParts } from '../../../test-utils/photoMocks.js'

vi.mock('../../../lib/image.js', async (importOriginal) => ({
  ...(await importOriginal()),
  loadImageToCanvas: vi.fn(),
}))

const file = new File(['x'], 'foto.png', { type: 'image/png' })
let restore
beforeEach(() => { restore = mockStageSize(200, 100) })
afterEach(() => restore())

async function setup() {
  loadImageToCanvas.mockResolvedValueOnce({ width: 100, height: 50 })
  const ctx = fakeCanvasContext([255, 0, 0, 255])
  const onPick = vi.fn()
  const utils = render(<PhotoColorPicker file={file} onPick={onPick} />)
  await waitFor(() => expect(ctx.drawImage).toHaveBeenCalled())
  await screen.findByRole('group', { name: 'Zoom de la foto' })
  const parts = viewportParts(utils.container)
  mockFrameRect(parts.frame)
  return { ...utils, ...parts, ctx, onPick }
}
const zoomIn = () => fireEvent.click(screen.getByRole('button', { name: 'Acercar' }))
const tap = (el, x, y) => { fireEvent.pointerDown(el, finger(1, x, y)); fireEvent.pointerUp(el, finger(1, x, y)) }

describe('PhotoColorPicker', () => {
  it('no muestra nada sin archivo', () => {
    const { container } = render(<PhotoColorPicker file={null} onPick={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('avisa si el archivo no es una imagen', async () => {
    loadImageToCanvas.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'not_image' }))
    const onError = vi.fn()
    render(<PhotoColorPicker file={file} onPick={() => {}} onError={onError} />)
    await waitFor(() => expect(onError).toHaveBeenCalledWith('El archivo no es una imagen.'))
  })

  it('un toque toma el color promedio del entorno de ese punto', async () => {
    const { frame, ctx, onPick } = await setup()
    tap(frame, 100, 50) // centro de la foto → píxel (50, 25) de la foto original
    expect(onPick).toHaveBeenCalledWith('#ff0000')
    expect(ctx.getImageData).toHaveBeenCalledWith(48, 23, 5, 5)
  })

  it('con zoom el toque toma el punto exacto de la foto original, no el de la pantalla', async () => {
    const { frame, ctx, onPick } = await setup()
    zoomIn(); zoomIn() // 2.25×, centrado
    tap(frame, 50, 50) // (50 + 125) / 450 = 0.389 de la foto → píxel 39 de 100
    expect(onPick).toHaveBeenCalledWith('#ff0000')
    expect(ctx.getImageData).toHaveBeenLastCalledWith(37, 23, 5, 5)
  })

  it('con zoom a 3× por doble toque, un toque cae en el punto correcto', async () => {
    const { frame, ctx, container } = await setup()
    tap(frame, 100, 50); tap(frame, 100, 50) // doble toque: 3× alrededor del centro
    expect(viewportParts(container).scale).toBe(3)
    ctx.getImageData.mockClear()
    tap(frame, 100, 50) // sigue siendo el centro de la foto
    expect(ctx.getImageData).toHaveBeenLastCalledWith(48, 23, 5, 5)
  })

  it('un arrastre mueve la foto y no elige ningún color', async () => {
    const { frame, onPick } = await setup()
    zoomIn(); zoomIn()
    fireEvent.pointerDown(frame, finger(1, 100, 50))
    fireEvent.pointerMove(frame, finger(1, 130, 50))
    fireEvent.pointerMove(frame, finger(1, 150, 50))
    fireEvent.pointerUp(frame, finger(1, 150, 50))
    expect(onPick).not.toHaveBeenCalled()
  })

  it('el doble toque hace zoom en lugar de elegir dos veces', async () => {
    const { frame, onPick } = await setup()
    tap(frame, 100, 50)
    tap(frame, 100, 50)
    expect(onPick).toHaveBeenCalledTimes(1) // solo el primer toque eligió
  })

  it('la mira queda en el punto elegido, expresada en la foto (sigue a la foto al hacer zoom)', async () => {
    const { frame, container } = await setup()
    tap(frame, 50, 25)
    const mira = container.querySelector('[class*="crosshair"]')
    expect(mira.style.left).toBe('25%')
    expect(mira.style.top).toBe('25%')
    zoomIn()
    expect(container.querySelector('[class*="crosshair"]').style.left).toBe('25%') // mismas coordenadas de la foto
  })

  it('un pellizco no elige un color', async () => {
    const { frame, onPick } = await setup()
    fireEvent.pointerDown(frame, finger(1, 60, 50))
    fireEvent.pointerDown(frame, finger(2, 140, 50))
    fireEvent.pointerMove(frame, finger(2, 180, 50))
    fireEvent.pointerUp(frame, finger(2, 180, 50))
    fireEvent.pointerUp(frame, finger(1, 60, 50))
    expect(onPick).not.toHaveBeenCalled()
  })
})
