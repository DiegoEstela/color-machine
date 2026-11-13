import { describe, expect, it } from 'vitest'
import { isRightSwipe, swipeDirection } from './swipe.js'

describe('swipeDirection', () => {
  it.each([
    [80, 5, 'right'],
    [-80, 5, 'left'],
    [30, 0, null], // corto
    [-30, 0, null],
    [80, 70, null], // diagonal
    [-80, -70, null],
    [0, 100, null], // vertical
  ])('dx=%i dy=%i → %s', (dx, dy, expected) => expect(swipeDirection(dx, dy)).toBe(expected))
  it('isRightSwipe es la misma regla de siempre', () => {
    expect(isRightSwipe(48, 0)).toBe(true)
    expect(isRightSwipe(47, 0)).toBe(false)
  })
})
