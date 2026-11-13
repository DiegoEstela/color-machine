import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoPicker } from '../index.js'

const file = new File(['x'], 'foto.png', { type: 'image/png' })

describe('PhotoPicker', () => {
  it('tiene un input con captura de cámara y otro de galería', () => {
    const { container } = render(<PhotoPicker onFile={() => {}} />)
    expect(container.querySelector('input[capture="environment"]')).toBeInTheDocument()
    expect(container.querySelectorAll('input[type="file"]')).toHaveLength(2)
    expect(screen.getByRole('button', { name: /Cámara/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Galería/ })).toBeInTheDocument()
  })
  it('entrega el archivo elegido', () => {
    const onFile = vi.fn()
    const { container } = render(<PhotoPicker onFile={onFile} />)
    fireEvent.change(container.querySelector('input[capture]'), { target: { files: [file] } })
    expect(onFile).toHaveBeenCalledWith(file)
  })
  it('no llama a onFile si no se eligió nada', () => {
    const onFile = vi.fn()
    const { container } = render(<PhotoPicker onFile={onFile} />)
    fireEvent.change(container.querySelector('input[capture]'), { target: { files: [] } })
    expect(onFile).not.toHaveBeenCalled()
  })
})
