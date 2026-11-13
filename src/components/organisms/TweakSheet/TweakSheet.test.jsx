import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TweakSheet } from '../index.js'

const shown = { mixHex: '#808080', deltaE: 3, quality: 'Muy parecido', parts: [], total: 1 }
const base = {
  open: true, onClose: () => {}, target: '#a0a0a0', shown, tweak: { light: 0, vivid: 0 },
  onChange: () => {}, onReset: () => {}, onAdd: () => {},
}
const blanco = { id: 'base-blanco', name: 'Blanco', hex: '#ffffff' }

describe('TweakSheet', () => {
  it('cerrado no muestra nada', () => {
    render(<TweakSheet {...base} open={false} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('es un diálogo con la comparación, los dos controles y una frase en palabras', () => {
    render(<TweakSheet {...base} />)
    expect(screen.getByRole('dialog', { name: 'Ajustar tu mezcla' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Tu color #a0a0a0' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Luz' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Intensidad' })).toBeInTheDocument()
    expect(screen.getByText(/Tu mezcla es .* más oscura que tu color/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Listo' })).toBeInTheDocument()
  })

  it('cada control cambia solo su eje y conserva el otro', () => {
    const onChange = vi.fn()
    render(<TweakSheet {...base} tweak={{ light: 1, vivid: -1 }} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    expect(onChange).toHaveBeenLastCalledWith({ light: 2, vivid: -1 })
    fireEvent.click(screen.getByRole('button', { name: 'Más intenso' }))
    expect(onChange).toHaveBeenLastCalledWith({ light: 1, vivid: 0 })
  })

  it('Restablecer está deshabilitado sin ajuste y se activa con uno', () => {
    const onReset = vi.fn()
    const { rerender } = render(<TweakSheet {...base} onReset={onReset} />)
    expect(screen.getByRole('button', { name: 'Restablecer' })).toBeDisabled()
    rerender(<TweakSheet {...base} onReset={onReset} tweak={{ light: 1, vivid: 0 }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Restablecer' }))
    expect(onReset).toHaveBeenCalled()
  })

  it('dice qué falta y ofrece sumar el color; con el máximo de pinturas lo deshabilita', () => {
    const onAdd = vi.fn()
    const props = { ...base, needs: ['Te falta blanco para que quede más claro.'], suggestions: [{ role: blanco, deltaE: 3 }], onAdd }
    const { rerender } = render(<TweakSheet {...props} />)
    expect(screen.getByRole('note', { name: 'Qué te falta' })).toHaveTextContent('Te falta blanco')
    fireEvent.click(screen.getByRole('button', { name: /Sumar Blanco, quedaría muy parecido/ }))
    expect(onAdd).toHaveBeenCalledWith(blanco)
    rerender(<TweakSheet {...props} atLimit />)
    expect(screen.getByRole('button', { name: /Sumar Blanco/ })).toBeDisabled()
    expect(screen.getByText(/máximo de pinturas/)).toBeInTheDocument()
  })

  it('mientras recalcula muestra "Calculando..." y deshabilita los controles', () => {
    render(<TweakSheet {...base} busy needs={['x']} />)
    expect(screen.getByText('Calculando...')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Más claro' })).toBeDisabled()
    expect(screen.queryByRole('note', { name: 'Qué te falta' })).not.toBeInTheDocument()
  })
})
