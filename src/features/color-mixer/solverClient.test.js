import { describe, expect, it } from 'vitest'
import { planAsync, solveAsync, suggestAsync } from './solverClient.js'
import { solve } from './solver.js'
import { planMissingPaints, suggestAdditions } from './advisor.js'
import { BASE_PAINTS } from './referencePaints.js'

const [rojo, , azul] = BASE_PAINTS

// jsdom no tiene Worker: se prueba el camino de respaldo en el hilo principal.
describe('solverClient (sin Worker)', () => {
  it('solveAsync devuelve lo mismo que solve', async () => {
    const input = { target: '#5b2a86', paints: [rojo, azul], maxParts: 6 }
    expect(await solveAsync(input)).toEqual(solve(input))
  })
  it('suggestAsync devuelve lo mismo que suggestAdditions', async () => {
    const target = '#cfb8e8'
    expect(await suggestAsync(target, [rojo, azul], 6)).toEqual(suggestAdditions(target, [rojo, azul], { maxParts: 6 }))
  })
  it('planAsync devuelve lo mismo que planMissingPaints', async () => {
    const target = '#2e8b3d'
    expect(await planAsync(target, [rojo, azul], 6)).toEqual(planMissingPaints(target, [rojo, azul], { maxParts: 6 }))
  })
  it('cede el hilo antes de calcular', async () => {
    let started = false
    const p = solveAsync({ target: '#5b2a86', paints: [rojo, azul], maxParts: 4 }).then(() => { started = true })
    expect(started).toBe(false)
    await p
    expect(started).toBe(true)
  })
})
