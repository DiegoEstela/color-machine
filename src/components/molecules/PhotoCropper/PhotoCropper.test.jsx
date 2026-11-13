import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhotoCropper } from '../index.js'
import { loadImageToCanvas } from '../../../lib/image.js'

vi.mock('../../../lib/image.js', async (importOriginal) => ({
  ...(await importOriginal()),
  loadImageToCanvas: vi.fn(),
}))

const file = new File(['x'], 'foto.png', { type: 'image/png' })

function fakeCanvas(rgba) {
  const data = new Uint8ClampedArray(rgba.length * 4 * 10)
  for (let i = 0; i < 10; i++) data.set(rgba, i * 4)
  const ctx = { drawImage: vi.fn(), getImageData: vi.fn(() => ({ data, width: 10, height: 1 })) }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAA')
  return ctx
}

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
    loadImageToCanvas.mockResolvedValueOnce({ width: 100, height: 50 })
    fakeCanvas([255, 0, 0, 255])
    const onChange = vi.fn()
    render(<PhotoCropper file={file} onChange={onChange} />)
    await waitFor(() => expect(onChange).toHaveBeenCalledWith({ hex: '#ff0000', thumbnail: 'data:image/png;base64,AAA' }))
  })

  it('arrastrar el recuadro lo mueve y recalcula el color', async () => {
    loadImageToCanvas.mockResolvedValueOnce({ width: 100, height: 50 })
    fakeCanvas([0, 0, 255, 255])
    const onChange = vi.fn()
    render(<PhotoCropper file={file} onChange={onChange} />)
    const box = await screen.findByTestId('crop-box')
    const canvas = screen.getByRole('img')
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 })
    const before = box.style.left
    const calls = onChange.mock.calls.length
    fireEvent.pointerDown(box, { clientX: 100, clientY: 50, pointerId: 1 })
    fireEvent.pointerMove(box, { clientX: 120, clientY: 50, pointerId: 1 }) // +10 % del ancho
    fireEvent.pointerUp(box, { pointerId: 1 })
    expect(box.style.left).not.toBe(before)
    expect(parseFloat(box.style.left)).toBeCloseTo(45)
    expect(onChange.mock.calls.length).toBeGreaterThan(calls)
  })

  it('arrastrar una esquina redimensiona sin salirse de la foto', async () => {
    loadImageToCanvas.mockResolvedValueOnce({ width: 100, height: 50 })
    fakeCanvas([0, 255, 0, 255])
    render(<PhotoCropper file={file} onChange={() => {}} />)
    const box = await screen.findByTestId('crop-box')
    screen.getByRole('img').getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 })
    const se = box.querySelector('[data-handle="se"]')
    fireEvent.pointerDown(se, { clientX: 130, clientY: 65, pointerId: 1 })
    fireEvent.pointerMove(se, { clientX: 1000, clientY: 1000, pointerId: 1 })
    fireEvent.pointerUp(se, { pointerId: 1 })
    expect(parseFloat(box.style.left) + parseFloat(box.style.width)).toBeCloseTo(100)
    expect(parseFloat(box.style.top) + parseFloat(box.style.height)).toBeCloseTo(100)
  })
})
