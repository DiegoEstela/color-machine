import { act, render } from '@testing-library/react'
import { useRef } from 'react'
import { describe, expect, it } from 'vitest'
import { hasMoreBelow, useCanScrollMore } from './useCanScrollMore.js'

describe('hasMoreBelow', () => {
  it.each([
    [{ scrollTop: 0, clientHeight: 300, scrollHeight: 600 }, true],
    [{ scrollTop: 300, clientHeight: 300, scrollHeight: 600 }, false], // al final
    [{ scrollTop: 299, clientHeight: 300, scrollHeight: 600 }, false], // redondeo
    [{ scrollTop: 0, clientHeight: 300, scrollHeight: 300 }, false], // entra entero
  ])('%o → %s', (m, expected) => expect(hasMoreBelow(m)).toBe(expected))
})

function Probe() {
  const ref = useRef(null)
  const more = useCanScrollMore(ref)
  return <div ref={ref} data-testid="box" data-more={String(more)} />
}

const setMetrics = (el, m) => Object.entries(m).forEach(([k, v]) => Object.defineProperty(el, k, { value: v, configurable: true, writable: true }))

describe('useCanScrollMore', () => {
  it('sigue el scroll del elemento', () => {
    const { getByTestId } = render(<Probe />)
    const box = getByTestId('box')
    expect(box).toHaveAttribute('data-more', 'false') // jsdom: todo mide 0
    setMetrics(box, { clientHeight: 300, scrollHeight: 600, scrollTop: 0 })
    act(() => { box.dispatchEvent(new Event('scroll')) })
    expect(box).toHaveAttribute('data-more', 'true')
    setMetrics(box, { scrollTop: 300 })
    act(() => { box.dispatchEvent(new Event('scroll')) })
    expect(box).toHaveAttribute('data-more', 'false')
  })
})
