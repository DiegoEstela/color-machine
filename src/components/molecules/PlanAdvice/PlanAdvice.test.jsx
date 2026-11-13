import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { PlanAdvice } from '../index.js'

const amarillo = { id: 'base-amarillo', name: 'Amarillo', hex: '#fcd116' }
const azul = { id: 'base-azul', name: 'Azul', hex: '#1d3fbb' }
const recipe = { parts: [{ name: 'Amarillo', parts: 3 }, { name: 'Azul', parts: 4 }] }
const plan = (roles, extra = {}) => ({ roles, recipe, quality: 'Muy parecido', enough: true, deltaE: 3, ...extra })

describe('PlanAdvice', () => {
  it('sin plan no muestra nada', () => {
    const { container } = render(<PlanAdvice plan={null} space={3} onAdd={() => {}} onAddAll={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('dice todos los colores que faltan y cómo queda la receta', () => {
    render(<PlanAdvice plan={plan([amarillo, azul])} space={4} onAdd={() => {}} onAddAll={() => {}} />)
    expect(screen.getByText(/te faltan: Amarillo y Azul/)).toBeInTheDocument()
    expect(screen.getByText(/3 Amarillo · 4 Azul/)).toBeInTheDocument()
  })

  it('"Agregar todos" suma el conjunto completo y los botones individuales suman de a uno', () => {
    const onAdd = vi.fn()
    const onAddAll = vi.fn()
    render(<PlanAdvice plan={plan([amarillo, azul])} space={4} onAdd={onAdd} onAddAll={onAddAll} />)
    fireEvent.click(screen.getByRole('button', { name: /Agregar todos/ }))
    expect(onAddAll).toHaveBeenCalledWith([amarillo, azul])
    fireEvent.click(screen.getByRole('button', { name: 'Sumar Azul, parte del plan' }))
    expect(onAdd).toHaveBeenCalledWith(azul)
  })

  it('con un solo color no hay "Agregar todos" y el botón dice cómo quedaría', () => {
    render(<PlanAdvice plan={plan([amarillo])} space={4} onAdd={() => {}} onAddAll={() => {}} />)
    expect(screen.queryByRole('button', { name: /Agregar todos/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sumar Amarillo, quedaría muy parecido' })).toBeInTheDocument()
  })

  it('si no entran todos deshabilita "Agregar todos" y lo explica; sin lugar deshabilita todo', () => {
    const { rerender } = render(<PlanAdvice plan={plan([amarillo, azul])} space={1} onAdd={() => {}} onAddAll={() => {}} />)
    expect(screen.getByRole('button', { name: /Agregar todos/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Sumar Amarillo/ })).toBeEnabled()
    expect(screen.getByRole('status')).toHaveTextContent('Solo entran 1 pintura más')
    rerender(<PlanAdvice plan={plan([amarillo, azul])} space={0} onAdd={() => {}} onAddAll={() => {}} />)
    expect(screen.getByRole('button', { name: /Sumar Amarillo/ })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent('máximo de pinturas')
  })

  it('si no hay nada que sumar dice lo más cerca que se llega, sin botones', () => {
    render(<PlanAdvice plan={plan([], { quality: 'Parecido', enough: false })} space={3} onAdd={() => {}} onAddAll={() => {}} />)
    expect(screen.getByText(/lo más cerca que se llega es parecido/)).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
