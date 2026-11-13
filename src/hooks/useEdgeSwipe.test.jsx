import { fireEvent, render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { isRightSwipe, useEdgeSwipe } from './useEdgeSwipe.js'

describe('isRightSwipe', () => {
  it.each([
    [80, 5, true],
    [48, 0, true],
    [47, 0, false], // muy corto
    [80, 60, false], // muy en diagonal
    [-80, 0, false], // hacia la izquierda
    [80, -20, true],
  ])('dx=%i dy=%i → %s', (dx, dy, expected) => expect(isRightSwipe(dx, dy)).toBe(expected))
})

function Probe({ onSwipe, enabled }) {
  useEdgeSwipe(onSwipe, enabled)
  return <div data-testid="area"><div data-no-edge-swipe data-testid="photo" /></div>
}

const point = (x, y) => ({ identifier: 1, clientX: x, clientY: y })
const swipe = (el, from, to) => {
  fireEvent.touchStart(el, { touches: [point(...from)], changedTouches: [point(...from)] })
  fireEvent.touchEnd(el, { touches: [], changedTouches: [point(...to)] })
}

describe('useEdgeSwipe', () => {
  it('llama a onSwipe con un deslizamiento horizontal hacia la derecha desde el borde', () => {
    const onSwipe = vi.fn()
    const { getByTestId } = render(<Probe onSwipe={onSwipe} enabled />)
    swipe(getByTestId('area'), [3, 300], [120, 310])
    expect(onSwipe).toHaveBeenCalledTimes(1)
  })
  it('ignora gestos que no empiezan en el borde, cortos, diagonales o hacia la izquierda', () => {
    const onSwipe = vi.fn()
    const { getByTestId } = render(<Probe onSwipe={onSwipe} enabled />)
    const el = getByTestId('area')
    swipe(el, [100, 300], [220, 300]) // no empezó en el borde
    swipe(el, [3, 300], [12, 300])
    swipe(el, [3, 300], [100, 450])
    swipe(el, [15, 300], [3, 300])
    expect(onSwipe).not.toHaveBeenCalled()
  })
  it('ignora el gesto sobre un elemento con data-no-edge-swipe (la foto con zoom)', () => {
    const onSwipe = vi.fn()
    const { getByTestId } = render(<Probe onSwipe={onSwipe} enabled />)
    swipe(getByTestId('photo'), [3, 300], [120, 300])
    expect(onSwipe).not.toHaveBeenCalled()
  })
  it('un gesto cancelado (el navegador empezó a hacer scroll) no abre nada', () => {
    const onSwipe = vi.fn()
    const { getByTestId } = render(<Probe onSwipe={onSwipe} enabled />)
    const el = getByTestId('area')
    fireEvent.touchStart(el, { touches: [point(3, 300)], changedTouches: [point(3, 300)] })
    fireEvent.touchCancel(el)
    fireEvent.touchEnd(el, { touches: [], changedTouches: [point(200, 300)] })
    expect(onSwipe).not.toHaveBeenCalled()
  })
  it('deshabilitado no escucha nada', () => {
    const onSwipe = vi.fn()
    const { getByTestId } = render(<Probe onSwipe={onSwipe} enabled={false} />)
    swipe(getByTestId('area'), [3, 300], [120, 300])
    expect(onSwipe).not.toHaveBeenCalled()
  })
})
