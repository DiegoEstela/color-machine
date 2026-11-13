import { render, screen, fireEvent } from '@testing-library/react'
import { ColorWheel } from '../index.js'

describe('ColorWheel', () => {
  it('los sliders emiten el color con teclado/rango', () => {
    const onChange = vi.fn()
    render(<ColorWheel value="#ff0000" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Matiz'), { target: { value: '120' } })
    expect(onChange).toHaveBeenLastCalledWith('#00ff00')
  })
  it('la claridad cambia el color manteniendo matiz y saturación', () => {
    const onChange = vi.fn()
    render(<ColorWheel value="#ff0000" onChange={onChange} />)
    fireEvent.change(screen.getByLabelText('Claridad'), { target: { value: '100' } })
    expect(onChange).toHaveBeenLastCalledWith('#ffffff')
  })
  it('un toque en el centro da saturación 0 (gris)', () => {
    const onChange = vi.fn()
    render(<ColorWheel value="#ff0000" onChange={onChange} />)
    const wheel = screen.getByTestId('color-wheel')
    wheel.getBoundingClientRect = () => ({ left: 0, top: 0, width: 480, height: 480 })
    fireEvent.pointerDown(wheel, { clientX: 240, clientY: 240, pointerId: 1 })
    const [hex] = onChange.mock.calls.at(-1)
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
    expect(Math.max(r, g, b) - Math.min(r, g, b)).toBeLessThanOrEqual(30) // casi gris (celda cercana al centro)
  })
  it('refleja un valor externo en los controles', () => {
    render(<ColorWheel value="#00ff00" onChange={() => {}} />)
    expect(screen.getByLabelText('Matiz')).toHaveValue('120')
  })
  it('funciona sin valor inicial', () => {
    render(<ColorWheel value={null} onChange={() => {}} />)
    expect(screen.getByLabelText('Claridad')).toBeInTheDocument()
  })

  it('Claridad queda visible y Matiz/Saturación dentro de "Ajuste fino"', () => {
    render(<ColorWheel value="#ff0000" onChange={() => {}} />)
    const fine = screen.getByText('Ajuste fino').closest('details')
    expect(fine).not.toHaveAttribute('open')
    expect(fine).toContainElement(screen.getByLabelText('Matiz'))
    expect(fine).toContainElement(screen.getByLabelText('Saturación'))
    expect(fine).not.toContainElement(screen.getByLabelText('Claridad'))
  })
  it('muestra el contenido de `aside` junto a la rueda', () => {
    render(<ColorWheel value={null} onChange={() => {}} aside={<p>vista del color</p>} />)
    expect(screen.getByText('vista del color')).toBeInTheDocument()
  })
})
