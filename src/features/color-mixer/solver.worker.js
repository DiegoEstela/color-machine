// Web Worker: calcula fuera del hilo principal para que la animación no se congele (sobre todo en "Preciso").
import { suggestAdditions } from './advisor.js'
import { solve } from './solver.js'

self.onmessage = ({ data: { id, kind, input } }) => {
  try {
    const result = kind === 'suggest' ? suggestAdditions(input.target, input.paints, { maxParts: input.maxParts }) : solve(input)
    self.postMessage({ id, result })
  } catch (error) {
    self.postMessage({ id, error: error.message })
  }
}
