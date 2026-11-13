import { describe, expect, it } from 'vitest'
import { fitSize, loadImageToCanvas } from './image.js'

describe('fitSize', () => {
  it('reduce manteniendo la proporción', () => {
    expect(fitSize(4000, 3000, 1000)).toEqual({ width: 1000, height: 750 })
    expect(fitSize(3000, 4000, 1000)).toEqual({ width: 750, height: 1000 })
  })
  it('no agranda imágenes chicas', () => {
    expect(fitSize(200, 100, 1000)).toEqual({ width: 200, height: 100 })
  })
})

describe('loadImageToCanvas', () => {
  it('rechaza archivos que no son imagen', async () => {
    const file = new File(['x'], 'a.txt', { type: 'text/plain' })
    await expect(loadImageToCanvas(file)).rejects.toMatchObject({ code: 'not_image' })
  })
  it('rechaza si no hay archivo', async () => {
    await expect(loadImageToCanvas(null)).rejects.toMatchObject({ code: 'not_image' })
  })
})
