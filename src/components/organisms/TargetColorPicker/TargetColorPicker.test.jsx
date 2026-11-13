import { render, screen, fireEvent } from '@testing-library/react'
import { TargetColorPicker } from '../index.js'

describe('TargetColorPicker', () => {
  it('"Siguiente" está deshabilitado sin color y activo con color', () => {
    const { rerender } = render(<TargetColorPicker value={null} onChange={() => {}} onNext={() => {}} />)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
    rerender(<TargetColorPicker value="#e63946" onChange={() => {}} onNext={() => {}} />)
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
  })

  it('llama onNext', () => {
    const onNext = vi.fn()
    render(<TargetColorPicker value="#e63946" onChange={() => {}} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(onNext).toHaveBeenCalled()
  })

  it.each([['#abc', '#aabbcc'], ['aabbcc', '#aabbcc'], ['#AABBCC', '#aabbcc']])(
    'el campo hex acepta %s',
    (text, expected) => {
      const onChange = vi.fn()
      render(<TargetColorPicker value={null} onChange={onChange} onNext={() => {}} />)
      fireEvent.change(screen.getByLabelText('Color (hex)'), { target: { value: text } })
      expect(onChange).toHaveBeenCalledWith(expected)
    },
  )

  it('rechaza hex inválido con mensaje y sin cambiar el color', () => {
    const onChange = vi.fn()
    render(<TargetColorPicker value="#e63946" onChange={onChange} onNext={() => {}} />)
    fireEvent.change(screen.getByLabelText('Color (hex)'), { target: { value: '#zz' } })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toHaveTextContent('hex válido')
  })

  it('cambia a la pestaña de foto y muestra cámara y galería', () => {
    render(<TargetColorPicker value={null} onChange={() => {}} onNext={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Foto' }))
    expect(screen.getByRole('button', { name: /Cámara/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Galería/ })).toBeInTheDocument()
  })

  it('muestra la miniatura del recorte como referencia', () => {
    render(<TargetColorPicker value="#e63946" thumbnail="data:image/png;base64,AAA" onChange={() => {}} onNext={() => {}} />)
    expect(screen.getByAltText('Recorte de la foto')).toHaveAttribute('src', 'data:image/png;base64,AAA')
  })

  it('en la pestaña Foto se puede elegir entre Recorte y Punto', () => {
    render(<TargetColorPicker value={null} onChange={() => {}} onNext={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Foto' }))
    expect(screen.getByRole('button', { name: 'Recorte' })).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Punto' }))
    expect(screen.getByRole('button', { name: 'Punto' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/Tocá un punto de la foto/)).toBeInTheDocument()
  })

  it('un color escrito a mano descarta la miniatura anterior', () => {
    const onThumbnail = vi.fn()
    render(<TargetColorPicker value="#e63946" thumbnail="data:x" onChange={() => {}} onThumbnail={onThumbnail} onNext={() => {}} />)
    fireEvent.change(screen.getByLabelText('Color (hex)'), { target: { value: '#00ff00' } })
    expect(onThumbnail).toHaveBeenCalledWith(null)
  })
})
