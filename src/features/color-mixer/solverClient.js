import { planMissingPaints, suggestAdditions } from './advisor.js'
import { solve } from './solver.js'

const local = {
  solve: (input) => solve(input),
  suggest: (input) => suggestAdditions(input.target, input.paints, { maxParts: input.maxParts }),
  plan: (input) => planMissingPaints(input.target, input.paints, { maxParts: input.maxParts }),
}

let worker = null
let broken = false // si el Worker falla una vez, se calcula siempre en el hilo principal
let seq = 0
const pending = new Map()

function getWorker() {
  if (broken || typeof Worker === 'undefined') return null
  if (worker) return worker
  try {
    worker = new Worker(new URL('./solver.worker.js', import.meta.url), { type: 'module' })
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id)
      if (!p) return
      pending.delete(data.id)
      if (data.error) p.reject(new Error(data.error))
      else p.resolve(data.result)
    }
    worker.onerror = () => {
      broken = true
      worker?.terminate()
      worker = null
      pending.forEach((p) => p.reject(new Error('worker_failed')))
      pending.clear()
    }
  } catch {
    broken = true
    worker = null
  }
  return worker
}

// Cede el hilo un instante para que se pinte "Mezclando..." antes de un cálculo pesado.
const runLocal = (kind, input) => new Promise((resolve) => setTimeout(() => resolve(local[kind](input)), 0))

function run(kind, input) {
  const w = getWorker()
  if (!w) return runLocal(kind, input)
  return new Promise((resolve, reject) => {
    const id = ++seq
    pending.set(id, { resolve, reject })
    w.postMessage({ id, kind, input })
  }).catch(() => runLocal(kind, input))
}

/** Igual que `solve`, pero asíncrono y fuera del hilo principal cuando se puede. */
export const solveAsync = (input) => run('solve', input)

/** Igual que `suggestAdditions`, asíncrono. */
export const suggestAsync = (target, paints, maxParts) => run('suggest', { target, paints, maxParts })

/** Igual que `planMissingPaints` (consejo completo: todos los colores que faltan), asíncrono. */
export const planAsync = (target, paints, maxParts) => run('plan', { target, paints, maxParts })
