import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { BASE_PAINTS } from '../../../features/color-mixer/referencePaints.js'
import { PaintPicker } from '../index.js'

const mine = [{ id: 'p1', name: 'Carmín', hex: '#aa1020' }]
const [rojo, amarillo] = BASE_PAINTS
const plan = { roles: [amarillo], recipe: { parts: [{ name: 'Amarillo', parts: 2 }, { name: 'Rojo', parts: 1 }] }, quality: 'Muy parecido', enough: true }

const setup = (props = {}) => {
  const onPick = vi.fn()
  const onClose = vi.fn()
  render(<PaintPicker open onClose={onClose} paints={mine} canAdd={() => true} onPick={onPick} {...props} />)
  return { onPick, onClose }
}

describe('PaintPicker', () => {
  it('cerrado no muestra nada', () => {
    render(<PaintPicker open={false} onClose={() => {}} canAdd={() => true} onPick={() => {}} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('lista Mis pinturas y las estándar', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Sumar otro color' })).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: 'Mis pinturas' })).getByRole('button', { name: 'Sumar Carmín' })).toBeInTheDocument()
    const standard = within(screen.getByRole('region', { name: 'Pinturas estándar' }))
    for (const p of BASE_PAINTS) expect(standard.getByRole('button', { name: `Sumar ${p.name}` })).toBeInTheDocument()
  })

  it('elegir una pintura la suma y cierra el selector', () => {
    const { onPick, onClose } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Sumar Carmín' }))
    expect(onPick).toHaveBeenCalledWith(mine[0])
    expect(onClose).toHaveBeenCalled()
  })

  it('arriba muestra "Te conviene sumar" con el consejo completo', () => {
    setup({ plan })
    const suggested = within(screen.getByRole('region', { name: 'Te conviene sumar' }))
    expect(suggested.getByText(/te falta: Amarillo/)).toBeInTheDocument()
    expect(suggested.getByRole('button', { name: 'Sumar Amarillo' })).toBeInTheDocument()
  })

  it('mientras llega el consejo lo avisa', () => {
    setup({ planLoading: true })
    expect(screen.getByText(/Buscando qué te conviene sumar/)).toBeInTheDocument()
  })

  it('si no entra más, deshabilita las pinturas nuevas y explica por qué', () => {
    setup({ canAdd: () => false })
    expect(screen.getByRole('button', { name: 'Sumar Carmín' })).toBeDisabled()
    expect(screen.getByRole('button', { name: `Sumar ${rojo.name}` })).toBeDisabled()
    expect(screen.getByText(/máximo de pinturas distintas/)).toBeInTheDocument()
  })

  it('sin pinturas guardadas lo dice', () => {
    setup({ paints: [] })
    expect(screen.getByText('Todavía no tenés pinturas guardadas.')).toBeInTheDocument()
  })
})
