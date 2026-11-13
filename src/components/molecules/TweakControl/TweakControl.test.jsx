import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TweakControl } from '../index.js'

const setup = (props = {}) => {
  const onChange = vi.fn()
  render(<TweakControl label="Luz" lowLabel="Más oscuro" highLabel="Más claro" value={0} onChange={onChange} {...props} />)
  return onChange
}

describe('TweakControl', () => {
  it('es un grupo con botones − y + con nombre accesible y un slider', () => {
    setup()
    expect(screen.getByRole('group', { name: 'Luz' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Más oscuro' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Más claro' })).toBeInTheDocument()
    const slider = screen.getByRole('slider', { name: 'Luz' })
    expect(slider).toHaveAttribute('aria-valuemin', '-3')
    expect(slider).toHaveAttribute('aria-valuemax', '3')
    expect(slider).toHaveAttribute('aria-valuenow', '0')
    expect(slider).toHaveAttribute('aria-valuetext', 'Como está')
  })

  it('los botones suman y restan un paso', () => {
    const onChange = setup({ value: 1 })
    fireEvent.click(screen.getByRole('button', { name: 'Más claro' }))
    expect(onChange).toHaveBeenLastCalledWith(2)
    fireEvent.click(screen.getByRole('button', { name: 'Más oscuro' }))
    expect(onChange).toHaveBeenLastCalledWith(0)
  })

  it('en los extremos el botón correspondiente se deshabilita', () => {
    setup({ value: 3 })
    expect(screen.getByRole('button', { name: 'Más claro' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Más oscuro' })).toBeEnabled()
  })

  it('las flechas, Inicio y Fin mueven el slider sin pasarse del límite', () => {
    const onChange = setup({ value: 3 })
    const slider = screen.getByRole('slider')
    fireEvent.keyDown(slider, { key: 'ArrowRight' })
    expect(onChange).toHaveBeenLastCalledWith(3)
    fireEvent.keyDown(slider, { key: 'ArrowLeft' })
    expect(onChange).toHaveBeenLastCalledWith(2)
    fireEvent.keyDown(slider, { key: 'Home' })
    expect(onChange).toHaveBeenLastCalledWith(-3)
  })

  it('describe el valor con palabras para lectores de pantalla', () => {
    setup({ value: -2 })
    expect(screen.getByRole('slider')).toHaveAttribute('aria-valuetext', '2 pasos más oscuro')
  })

  it('deshabilitado no responde', () => {
    const onChange = setup({ disabled: true })
    fireEvent.keyDown(screen.getByRole('slider'), { key: 'ArrowRight' })
    expect(onChange).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Más claro' })).toBeDisabled()
  })
})
