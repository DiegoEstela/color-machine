import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhotoCropper } from '../index.js'
import { loadImageToCanvas } from '../../../lib/image.js'
import { fakeCanvasContext, finger, mockFrameRect, mockStageSize, viewportParts } from '../../../test-utils/photoMocks.js'

vi.mock('../../../lib/image.js', async (importOriginal) => ({
  ...(await importOriginal()),
  loadImageToCanvas: vi.fn(),
}))

const file = new File(['x'], 'foto.png', { type: 'image/png' })
let restore
// Reloj controlado: `performance.now()` solo avanza cuando el test lo pide, así los toques y dobles toques
// no dependen de la velocidad de la máquina.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['performance'] })
  restore = mockStageSize(200, 100)
})
afterEach(() => {
  restore()
  vi.useRealTimers()
})

async function setup(rgba = [0, 0, 255, 255]) {
  loadImageToCanvas.mockResolvedValueOnce({ width: 100, height: 50 })
  fakeCanvasContext(rgba)
  const onChange = vi.fn()
  const utils = render(<PhotoCropper file={file} onChange={onChange} />)
  const box = await screen.findByTestId('crop-box')
  const parts = viewportParts(utils.container)
  mockFrameRect(parts.frame)
  return { ...utils, ...parts, box, onChange }
}
const zoomIn = () => fireEvent.click(screen.getByRole('button', { name: 'Acercar' }))
const left = (box) => parseFloat(box.style.left)

describe('PhotoCropper', () => {
  it('no muestra nada sin archivo', () => {
    const { container } = render(<PhotoCropper file={null} onChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('avisa si el archivo no es una imagen', async () => {
    loadImageToCanvas.mockRejectedValueOnce(Object.assign(new Error('x'), { code: 'not_image' }))
    const onError = vi.fn()
    render(<PhotoCropper file={file} onChange={() => {}} onError={onError} />)
    await waitFor(() => expect(onError).toHaveBeenCalledWith('El archivo no es una imagen.'))
  })

  it('al cargar la foto entrega el color del recorte y su miniatura', async () => {
    const { onChange } = await setup([255, 0, 0, 255])
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ hex: '#ff0000', thumbnail: 'data:image/png;base64,AAA' }))
  })

  it('arrastrar el recuadro lo mueve y recalcula el color', async () => {
    const { box, onChange } = await setup()
    const calls = onChange.mock.calls.length
    fireEvent.pointerDown(box, finger(1, 100, 50))
    fireEvent.pointerMove(box, finger(1, 120, 50)) // +10 % del ancho a 1×
    fireEvent.pointerUp(box, finger(1, 120, 50))
    expect(left(box)).toBeCloseTo(45)
    expect(onChange.mock.calls.length).toBeGreaterThan(calls)
  })

  it('con zoom el mismo desplazamiento del dedo mueve el recuadro menos (más precisión)', async () => {
    const { box } = await setup()
    zoomIn(); zoomIn() // 2.25×
    fireEvent.pointerDown(box, finger(1, 100, 50))
    fireEvent.pointerMove(box, finger(1, 145, 50)) // 45 px de pantalla = 10 % de la foto a 2.25×
    fireEvent.pointerUp(box, finger(1, 145, 50))
    expect(left(box)).toBeCloseTo(45)
  })

  it('arrastrar una esquina redimensiona sin salirse de la foto', async () => {
    const { box } = await setup()
    const se = box.querySelector('[data-handle="se"]')
    fireEvent.pointerDown(se, finger(1, 130, 65))
    fireEvent.pointerMove(se, finger(1, 1000, 1000))
    fireEvent.pointerUp(se, finger(1, 1000, 1000))
    expect(left(box) + parseFloat(box.style.width)).toBeCloseTo(100)
    expect(parseFloat(box.style.top) + parseFloat(box.style.height)).toBeCloseTo(100)
  })

  it('redimensionar una esquina con zoom también divide por el zoom', async () => {
    const { box } = await setup()
    zoomIn(); zoomIn()
    const se = box.querySelector('[data-handle="se"]')
    const before = parseFloat(box.style.width)
    fireEvent.pointerDown(se, finger(1, 130, 65))
    fireEvent.pointerMove(se, finger(1, 175, 65)) // +45 px = +10 % de la foto
    fireEvent.pointerUp(se, finger(1, 175, 65))
    expect(parseFloat(box.style.width) - before).toBeCloseTo(10)
  })

  it('el recuadro y sus esquinas llevan la marca de "gesto propio" para no mover la foto', async () => {
    const { box } = await setup()
    expect(box).toHaveAttribute('data-own-gesture', 'drag')
    for (const handle of box.querySelectorAll('[data-handle]')) expect(handle).toHaveAttribute('data-own-gesture', 'drag')
  })

  it('el doble toque sobre el recuadro también acerca y vuelve (aunque el recuadro cubra casi toda la foto)', async () => {
    const { box, container } = await setup()
    const tap = () => { fireEvent.pointerDown(box, finger(1, 100, 50)); fireEvent.pointerUp(box, finger(1, 100, 50)) }
    tap(); tap()
    expect(viewportParts(container).scale).toBe(3)
    tap(); tap()
    expect(viewportParts(container).scale).toBe(1)
  })

  it('arrastrar el recuadro no cuenta como doble toque ni cambia el zoom', async () => {
    const { box, container } = await setup()
    for (let i = 0; i < 2; i++) {
      fireEvent.pointerDown(box, finger(1, 100, 50))
      fireEvent.pointerMove(box, finger(1, 130, 50))
      fireEvent.pointerUp(box, finger(1, 130, 50))
    }
    expect(viewportParts(container).scale).toBe(1)
  })

  it('un toque simple sobre el recuadro no mueve nada', async () => {
    const { box } = await setup()
    const before = box.style.left
    fireEvent.pointerDown(box, finger(1, 100, 50))
    fireEvent.pointerUp(box, finger(1, 100, 50))
    expect(box.style.left).toBe(before)
  })

  it('arrastrar el fondo con zoom mueve la foto y el recuadro la sigue', async () => {
    const { box, frame, container } = await setup()
    zoomIn(); zoomIn()
    const before = viewportParts(container)
    const boxBefore = { left: box.style.left, top: box.style.top }
    fireEvent.pointerDown(frame, finger(1, 20, 20)) // fuera del recuadro
    fireEvent.pointerMove(frame, finger(1, 40, 20))
    fireEvent.pointerMove(frame, finger(1, 60, 20))
    fireEvent.pointerUp(frame, finger(1, 60, 20))
    expect(viewportParts(container).x).toBeGreaterThan(before.x)
    // el recuadro no cambia sus coordenadas en la foto: se mueve con ella
    expect({ left: box.style.left, top: box.style.top }).toEqual(boxBefore)
  })

  it('un pellizco no mueve el recuadro ni el arrastre en curso', async () => {
    const { box, frame, container } = await setup()
    fireEvent.pointerDown(box, finger(1, 100, 50)) // primer dedo sobre el recuadro
    fireEvent.pointerDown(frame, finger(2, 20, 50)) // segundo dedo: pellizco
    fireEvent.pointerMove(box, finger(1, 150, 50))
    expect(left(box)).toBeCloseTo(35) // el recuadro no se movió
    expect(viewportParts(container).scale).toBeGreaterThan(1)
    fireEvent.pointerUp(box, finger(1, 150, 50))
    fireEvent.pointerUp(frame, finger(2, 20, 50))
  })

  it('al terminar un pellizco el recuadro se puede mover de nuevo', async () => {
    const { box, frame } = await setup()
    fireEvent.pointerDown(frame, finger(1, 20, 20))
    fireEvent.pointerDown(frame, finger(2, 60, 20))
    fireEvent.pointerUp(frame, finger(2, 60, 20))
    fireEvent.pointerUp(frame, finger(1, 20, 20))
    fireEvent.pointerDown(box, finger(3, 100, 50))
    fireEvent.pointerMove(box, finger(3, 120, 50))
    fireEvent.pointerUp(box, finger(3, 120, 50))
    expect(left(box)).toBeCloseTo(45)
  })

  it('el color se calcula sobre la foto original: el zoom no cambia lo que se muestrea', async () => {
    const { onChange } = await setup([10, 20, 30, 255])
    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const calls = onChange.mock.calls.length
    zoomIn(); zoomIn()
    expect(onChange.mock.calls.length).toBe(calls) // hacer zoom no recalcula nada
  })
})
