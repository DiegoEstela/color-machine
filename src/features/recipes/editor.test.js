import { describe, expect, it } from 'vitest'
import { deltaE, mixHex } from '../color-mixer/mixer.js'
import {
  EDITOR_MAX_PAINTS, EDITOR_MAX_PARTS, HISTORY_MAX, addPaint, buildEditPayload, bumpParts, canAddPaint, compareToSaved,
  copyName, createDraft, darken, draftResult, editorReducer, initEditor, isDirty, lighten, removePaint,
} from './editor.js'

const mix = [{ name: 'Rojo', hex: '#E4002B', parts: 2 }, { name: 'Azul', hex: '#1d3fbb', parts: 1 }]
const lum = (hex) => parseInt(hex.slice(1, 3), 16) + parseInt(hex.slice(3, 5), 16) + parseInt(hex.slice(5, 7), 16)

describe('borrador', () => {
  it('copia la receta con los hex en minúsculas y sin compartir objetos', () => {
    const draft = createDraft(mix)
    expect(draft).toEqual([{ name: 'Rojo', hex: '#e4002b', parts: 2 }, { name: 'Azul', hex: '#1d3fbb', parts: 1 }])
    draft[0].parts = 9
    expect(mix[0].parts).toBe(2)
  })
  it('bumpParts sube y baja entre 1 y 20 y ignora índices inexistentes', () => {
    const d = createDraft(mix)
    expect(bumpParts(d, 0, 1)[0].parts).toBe(3)
    expect(bumpParts(d, 1, -1)).toBe(d) // ya está en 1: no cambia
    expect(bumpParts(bumpParts(d, 0, 100), 0, 100)[0].parts).toBe(EDITOR_MAX_PARTS)
    expect(bumpParts(d, 7, 1)).toBe(d)
  })
  it('removePaint quita una pintura pero siempre deja al menos una', () => {
    const d = createDraft(mix)
    expect(removePaint(d, 0).map((p) => p.name)).toEqual(['Azul'])
    expect(removePaint(removePaint(d, 0), 0)).toHaveLength(1)
  })
  it('addPaint suma partes si ya está y agrega si no; respeta el máximo de 6', () => {
    const d = createDraft(mix)
    expect(addPaint(d, { name: 'Rojo', hex: '#e4002b' }).find((p) => p.name === 'Rojo').parts).toBe(3)
    const withYellow = addPaint(d, { name: 'Amarillo', hex: '#FCD116' })
    expect(withYellow).toHaveLength(3)
    expect(withYellow[2]).toEqual({ name: 'Amarillo', hex: '#fcd116', parts: 1 })
    let full = d
    for (let i = 0; i < 10; i++) full = addPaint(full, { name: `P${i}`, hex: `#00000${i}` })
    expect(full).toHaveLength(EDITOR_MAX_PAINTS)
    expect(canAddPaint(full, { name: 'Otra', hex: '#abcdef' })).toBe(false)
    expect(canAddPaint(full, { name: 'P0', hex: '#000000' })).toBe(true) // ya está: suma una parte
  })
})

describe('Más claro / Más oscuro', () => {
  it('lighten suma 1 parte de Blanco y aclara el resultado; si ya está, suma otra parte', () => {
    const d = createDraft(mix)
    const lighter = lighten(d)
    expect(lighter.find((p) => p.name === 'Blanco')).toMatchObject({ hex: '#ffffff', parts: 1 })
    expect(lum(draftResult(lighter))).toBeGreaterThan(lum(draftResult(d)))
    expect(lighten(lighter).find((p) => p.name === 'Blanco').parts).toBe(2)
  })
  it('darken suma 1 parte de Negro y oscurece el resultado', () => {
    const d = createDraft(mix)
    const darker = darken(d)
    expect(darker.find((p) => p.name === 'Negro').parts).toBe(1)
    expect(lum(draftResult(darker))).toBeLessThan(lum(draftResult(d)))
  })
})

describe('resultado y comparación', () => {
  it('draftResult usa la misma mezcla que el resto de la app', () => {
    expect(draftResult(createDraft(mix))).toBe(mixHex([{ hex: '#e4002b', parts: 2 }, { hex: '#1d3fbb', parts: 1 }]))
  })
  it('compareToSaved mide contra el color buscado original: mejoró / igual / empeoró', () => {
    const target = '#8a1c5d'
    const saved = draftResult(createDraft(mix))
    const better = mixHex([{ hex: '#e4002b', parts: 3 }, { hex: '#1d3fbb', parts: 2 }]) // más cerca del target (probado abajo)
    const c = compareToSaved({ target, savedResult: saved, draftResult: better })
    expect(c.before).toBeCloseTo(deltaE(target, saved), 6)
    expect(c.after).toBeCloseTo(deltaE(target, better), 6)
    expect(c.trend).toBe(c.after < c.before ? 'better' : 'worse')
    expect(compareToSaved({ target, savedResult: saved, draftResult: saved }).trend).toBe('same')
    expect(compareToSaved({ target: saved, savedResult: saved, draftResult: '#000000' }).trend).toBe('worse')
    expect(compareToSaved({ target: '#808080', savedResult: '#000000', draftResult: '#808080' }).trend).toBe('better')
  })
})

describe('isDirty y buildEditPayload', () => {
  it('isDirty detecta cambios y no se confunde por mayúsculas', () => {
    const saved = createDraft(mix)
    expect(isDirty(saved, createDraft(mix))).toBe(false)
    expect(isDirty(saved, bumpParts(saved, 0, 1))).toBe(true)
    expect(isDirty(mix, saved)).toBe(false)
  })
  it('buildEditPayload devuelve mix y result_hex (no toca el color buscado)', () => {
    const { payload, error } = buildEditPayload(lighten(createDraft(mix)))
    expect(error).toBeUndefined()
    expect(Object.keys(payload).sort()).toEqual(['mix', 'result_hex'])
    expect(payload.result_hex).toMatch(/^#[0-9a-f]{6}$/)
    expect(payload.mix.find((m) => m.name === 'Blanco').parts).toBe(1)
  })
  it('rechaza borradores inválidos', () => {
    expect(buildEditPayload([]).error).toBeTruthy()
    expect(buildEditPayload([{ name: ' ', hex: '#ffffff', parts: 1 }]).error).toBeTruthy()
    expect(buildEditPayload([{ name: 'X', hex: 'nope', parts: 1 }]).error).toBeTruthy()
    expect(buildEditPayload([{ name: 'X', hex: '#ffffff', parts: 1.5 }]).error).toBeTruthy()
  })
})

describe('copyName', () => {
  it('agrega "(editada)" y respeta el máximo de 60 caracteres', () => {
    expect(copyName('Violeta')).toBe('Violeta (editada)')
    expect(copyName('x'.repeat(80))).toHaveLength(60)
    expect(copyName('x'.repeat(80)).endsWith(' (editada)')).toBe(true)
  })
})

describe('editorReducer', () => {
  it('empieza limpio y cada cambio se puede deshacer hasta llegar a lo guardado', () => {
    let s = initEditor(mix)
    expect(isDirty(s.saved, s.draft)).toBe(false)
    s = editorReducer(s, { type: 'bump', index: 0, delta: 1 })
    s = editorReducer(s, { type: 'lighten' })
    expect(s.history).toHaveLength(2)
    s = editorReducer(s, { type: 'undo' })
    expect(s.draft.find((p) => p.name === 'Blanco')).toBeUndefined()
    s = editorReducer(s, { type: 'undo' })
    expect(isDirty(s.saved, s.draft)).toBe(false)
    expect(editorReducer(s, { type: 'undo' })).toBe(s) // nada más que deshacer
  })
  it('un cambio que no cambia nada no ensucia el historial', () => {
    const s = initEditor(mix)
    expect(editorReducer(s, { type: 'bump', index: 1, delta: -1 })).toBe(s)
    expect(editorReducer(s, { type: 'remove', index: 9 })).toBe(s)
  })
  it('reset vuelve a lo guardado de una vez y se puede deshacer', () => {
    let s = initEditor(mix)
    s = editorReducer(editorReducer(s, { type: 'darken' }), { type: 'add', paint: { name: 'Amarillo', hex: '#fcd116' } })
    const reset = editorReducer(s, { type: 'reset' })
    expect(isDirty(reset.saved, reset.draft)).toBe(false)
    expect(isDirty(reset.saved, editorReducer(reset, { type: 'undo' }).draft)).toBe(true)
    expect(editorReducer(initEditor(mix), { type: 'reset' }).history).toHaveLength(0)
  })
  it('"saved" toma el borrador como lo guardado y limpia el historial', () => {
    let s = editorReducer(initEditor(mix), { type: 'lighten' })
    s = editorReducer(s, { type: 'saved' })
    expect(isDirty(s.saved, s.draft)).toBe(false)
    expect(s.history).toEqual([])
  })
  it('el historial guarda como máximo 30 cambios', () => {
    let s = initEditor(mix)
    for (let i = 0; i < HISTORY_MAX + 5; i++) s = editorReducer(s, { type: 'bump', index: 0, delta: i % 2 ? -1 : 1 })
    expect(s.history.length).toBeLessThanOrEqual(HISTORY_MAX)
  })
  it('una acción desconocida no cambia el estado', () => {
    const s = initEditor(mix)
    expect(editorReducer(s, { type: 'x' })).toBe(s)
  })
})
