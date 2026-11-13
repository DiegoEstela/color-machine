import { converter, formatHex } from 'culori'
import { describe, expect, it } from 'vitest'
import {
  NEUTRAL_TWEAK, TWEAK_LIMIT, clampTweak, describeGap, describeNeeds, describeTweak, isNeutral, shiftTarget,
} from './tweak.js'

const lch = converter('lch')

describe('clampTweak / isNeutral', () => {
  it('recorta a ±3, redondea y tolera valores inválidos', () => {
    expect(clampTweak({ light: 9, vivid: -9 })).toEqual({ light: TWEAK_LIMIT, vivid: -TWEAK_LIMIT })
    expect(clampTweak({ light: 1.4, vivid: 'x' })).toEqual({ light: 1, vivid: 0 })
    expect(clampTweak(undefined)).toEqual(NEUTRAL_TWEAK)
  })
  it('sin pasos es neutro', () => {
    expect(isNeutral(NEUTRAL_TWEAK)).toBe(true)
    expect(isNeutral(undefined)).toBe(true)
    expect(isNeutral({ light: 0, vivid: 1 })).toBe(false)
  })
})

describe('shiftTarget', () => {
  const base = '#c0507a'
  it('sin ajuste devuelve el mismo color (normalizado)', () => {
    expect(shiftTarget('C0507A', NEUTRAL_TWEAK)).toBe('#c0507a')
    expect(shiftTarget('nope', { light: 1, vivid: 0 })).toBeNull()
  })
  it('más luz suma claridad y menos luz la resta, sin cambiar el tono', () => {
    const l0 = lch(base)
    const up = lch(shiftTarget(base, { light: 2, vivid: 0 }))
    const down = lch(shiftTarget(base, { light: -2, vivid: 0 }))
    expect(up.l).toBeGreaterThan(l0.l + 5)
    expect(down.l).toBeLessThan(l0.l - 5)
    expect(Math.abs(up.h - l0.h)).toBeLessThan(6)
  })
  it('más intenso sube el croma y más apagado lo baja', () => {
    const c0 = lch('#b46a6a').c
    expect(lch(shiftTarget('#b46a6a', { light: 0, vivid: 3 })).c).toBeGreaterThan(c0)
    expect(lch(shiftTarget('#b46a6a', { light: 0, vivid: -3 })).c).toBeLessThan(c0)
  })
  it('más y más luz sobre un color claro termina en blanco válido, no se rompe', () => {
    expect(shiftTarget('#f5f5f5', { light: 3, vivid: 0 })).toMatch(/^#[0-9a-f]{6}$/)
    expect(shiftTarget('#050505', { light: -3, vivid: 3 })).toMatch(/^#[0-9a-f]{6}$/)
  })
  it('un gris no gana color al pedir más intensidad', () => {
    expect(lch(shiftTarget('#808080', { light: 0, vivid: 3 })).c).toBeLessThan(2)
  })
})

describe('describeGap', () => {
  it('detecta más clara / más oscura', () => {
    expect(describeGap('#808080', '#d0d0d0').light).toBe('lighter')
    expect(describeGap('#808080', '#303030').light).toBe('darker')
    expect(describeGap('#808080', '#d0d0d0').sentences[0]).toMatch(/más clara/)
  })
  it('detecta más intensa / más apagada', () => {
    expect(describeGap('#a06060', '#e03030').vivid).toBe('more')
    expect(describeGap('#e03030', '#a06060').vivid).toBe('duller')
  })
  it('si solo cambia la intensidad, la frase se entiende sola', () => {
    expect(describeGap('#a06060', '#e03030').sentences[0]).toMatch(/^Tu mezcla es .* más intensa que tu color\.$/)
  })
  it('si cambian las dos cosas, la segunda frase continúa la primera', () => {
    const { sentences } = describeGap('#808080', '#ff9090')
    expect(sentences[0]).toMatch(/^Tu mezcla es/)
    expect(sentences[1]).toMatch(/^Y es /)
  })
  it('si es casi igual lo dice', () => {
    const gap = describeGap('#336699', '#346a9a')
    expect(gap.light).toBe('same')
    expect(gap.vivid).toBe('same')
    expect(gap.tone).toBe('same')
    expect(gap.sentences).toEqual(['Tu mezcla tiene casi la misma luz, intensidad y tono que tu color.'])
  })
  it('distingue "un poco" de "bastante"', () => {
    expect(describeGap('#808080', '#8c8c8c').sentences[0]).toMatch(/un poco/)
    expect(describeGap('#808080', '#e0e0e0').sentences[0]).toMatch(/bastante/)
  })
})

describe('describeGap: tono', () => {
  // Colores armados en Lab (misma claridad) para controlar justo hacia dónde se corre la mezcla.
  const lab = (l, a, b) => formatHex({ mode: 'lab', l, a, b })
  const target = lab(50, 15, 35) // un marrón

  it('detecta hacia qué tono tira la mezcla (más rojo, verde, amarillo o azul)', () => {
    expect(describeGap(target, lab(50, 24, 35)).tone).toBe('redder')
    expect(describeGap(target, lab(50, 6, 35)).tone).toBe('greener')
    expect(describeGap(target, lab(50, 15, 44)).tone).toBe('yellower')
    expect(describeGap(target, lab(50, 15, 26)).tone).toBe('bluer')
    expect(describeGap(target, target).tone).toBe('same')
  })
  it('un corrimiento chico no cuenta', () => {
    expect(describeGap(target, lab(50, 16, 36)).tone).toBe('same')
  })
  it('lo agrega a las frases: sola si es lo único que cambia, y continuando si hay más', () => {
    const only = describeGap(target, lab(50, 15, 26))
    expect(only.light).toBe('same')
    expect(only.sentences).toEqual(expect.arrayContaining([expect.stringMatching(/tira a azul/)]))
    const both = describeGap(target, lab(60, 15, 26))
    expect(both.sentences[0]).toMatch(/más clara/)
    expect(both.sentences.at(-1)).toMatch(/^Y tira a azul\.$/)
  })
})

describe('describeTweak', () => {
  it('describe el ajuste activo y queda vacío sin ajuste', () => {
    expect(describeTweak(NEUTRAL_TWEAK)).toBe('')
    expect(describeTweak({ light: 1, vivid: -2 })).toBe('Ajustada: +1 luz, −2 intensidad')
    expect(describeTweak({ light: -3, vivid: 0 })).toBe('Ajustada: −3 luz')
  })
})

describe('describeNeeds', () => {
  it('traduce el diagnóstico en qué sumar', () => {
    expect(describeNeeds([{ code: 'need_white' }])).toEqual(['Te falta blanco para que quede más claro.'])
    expect(describeNeeds([{ code: 'need_black' }, { code: 'need_vivid' }])).toHaveLength(2)
    expect(describeNeeds([{ code: 'need_hue' }])).toEqual([]) // el tono lo cubre el consejo completo
    expect(describeNeeds([{ code: 'otra' }])).toEqual([])
  })
})
