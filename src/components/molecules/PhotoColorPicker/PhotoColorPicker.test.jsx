import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PhotoColorPicker } from '../index.js'
import { loadImageToCanvas } from '../../../lib/image.js'

vi.mock('../../../lib/image.js', () => ({ loadImageToCanvas: vi.fn() }))

const file = new File(['x'], 'foto.png', { type: 'image/png' })

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

  it('al tocar la foto entrega el color promedio del entorno', async () => {
    loadImageToCanvas.mockResolvedValueOnce({ width: 100, height: 50 })
    const data = new Uint8ClampedArray(5 * 5 * 4)
    for (let i = 0; i < 25; i++) data.set([255, 0, 0, 255], i * 4)
    const fakeCtx = { drawImage: vi.fn(), getImageData: vi.fn(() => ({ data, width: 5, height: 5 })) }
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx)
    const onPick = vi.fn()
    render(<PhotoColorPicker file={file} onPick={onPick} />)
    const canvas = screen.getByRole('img')
    await waitFor(() => expect(fakeCtx.drawImage).toHaveBeenCalled())
    canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 200, height: 100 })
    fireEvent.click(canvas, { clientX: 100, clientY: 50 })
    expect(onPick).toHaveBeenCalledWith('#ff0000')
    expect(fakeCtx.getImageData).toHaveBeenCalledWith(48, 23, 5, 5)
  })
})
