import { describe, expect, it } from 'vitest'
import { JAR_GRID } from './PixelJar/grid.js'
import { LOGO_GRID } from './PixelLogo/grid.js'
import { SPARKLE_GRID } from './PixelSparkle/grid.js'

const rectangular = (grid) => grid.every((row) => row.length === grid[0].length)

describe('dibujos pixel', () => {
  it('el logo es una cuadrícula cuadrada de 16x16', () => {
    expect(LOGO_GRID).toHaveLength(16)
    expect(rectangular(LOGO_GRID)).toBe(true)
    expect(LOGO_GRID[0]).toHaveLength(16)
  })
  it('el destello es de 9x9 y simétrico', () => {
    expect(SPARKLE_GRID).toHaveLength(9)
    expect(rectangular(SPARKLE_GRID)).toBe(true)
    expect(SPARKLE_GRID[0]).toHaveLength(9)
    expect(SPARKLE_GRID.map((r) => [...r].reverse().join(''))).toEqual(SPARKLE_GRID)
    expect([...SPARKLE_GRID].reverse()).toEqual(SPARKLE_GRID)
  })
  it('el frasco es rectangular, de 12 de ancho, y tiene lugar para el color', () => {
    expect(rectangular(JAR_GRID)).toBe(true)
    expect(JAR_GRID[0]).toHaveLength(12)
    expect(JAR_GRID.join('')).toContain('c')
  })
  it('solo usan los caracteres de su paleta', () => {
    expect(new Set(LOGO_GRID.join(''))).toEqual(new Set('.kpwbym'.split('').filter((c) => LOGO_GRID.join('').includes(c))))
    for (const grid of [JAR_GRID]) expect([...new Set(grid.join(''))].every((c) => '.klcws'.includes(c))).toBe(true)
    expect([...new Set(SPARKLE_GRID.join(''))].every((c) => '.kf'.includes(c))).toBe(true)
  })
})
