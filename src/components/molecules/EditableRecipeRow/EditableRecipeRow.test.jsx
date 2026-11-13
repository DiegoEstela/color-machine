import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { EditableRecipeRow } from '../index.js'

const setup = (props = {}) => {
  const handlers = { onChangeParts: vi.fn(), onRemove: vi.fn() }
  render(<ul><EditableRecipeRow name="Azul" hex="#1d3fbb" parts={3} total={6} {...handlers} {...props} /></ul>)
  return handlers
}

describe('EditableRecipeRow', () => {
  it('muestra la pintura con su stepper y la proporción en la barra', () => {
    setup()
    expect(screen.getByText('Azul')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Partes de Azul' })).toBeInTheDocument()
    expect(document.querySelector('[class*="fill"]').style.width).toBe('50%')
  })
  it('cambia partes y quita la pintura', () => {
    const { onChangeParts, onRemove } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Sumar una parte de Azul' }))
    expect(onChangeParts).toHaveBeenCalledWith(1)
    fireEvent.click(screen.getByRole('button', { name: 'Quitar Azul' }))
    expect(onRemove).toHaveBeenCalled()
  })
  it('si es la única pintura no se puede quitar', () => {
    setup({ canRemove: false })
    expect(screen.getByRole('button', { name: 'Quitar Azul' })).toBeDisabled()
  })
})
