import { vi } from 'vitest'

const protoDesc = (name) => Object.getOwnPropertyDescriptor(HTMLElement.prototype, name)

/**
 * jsdom no calcula tamaños: hace que el "escenario" de PhotoViewport (donde vive la foto) mida `w` x `h`
 * a 1×, como lo mediría el navegador. Devuelve una función para restaurar.
 */
export function mockStageSize(w = 200, h = 100) {
  const original = { w: protoDesc('offsetWidth'), h: protoDesc('offsetHeight') }
  const isStage = (el) => String(el.className).includes('stage')
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get() { return isStage(this) ? w : 0 } })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get() { return isStage(this) ? h : 0 } })
  return () => {
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', original.w)
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original.h)
  }
}

/** Marco, escenario y transformación actual de un PhotoViewport ya renderizado. */
export function viewportParts(container) {
  const frame = container.querySelector('[class*="frame"]')
  const stage = frame.querySelector('[class*="stage"]')
  const match = /translate\((-?[\d.]+)px, (-?[\d.]+)px\) scale\(([\d.]+)\)/.exec(stage.style.transform)
  return { frame, stage, x: Number(match[1]), y: Number(match[2]), scale: Number(match[3]) }
}

/** El marco empieza en (0, 0) de la pantalla y mide `w` x `h`. */
export function mockFrameRect(frame, w = 200, h = 100) {
  frame.getBoundingClientRect = () => ({ left: 0, top: 0, right: w, bottom: h, width: w, height: h })
}

/** Canvas falso: `drawImage` y `getImageData` devuelven un color liso. */
export function fakeCanvasContext(rgba, size = 5) {
  const data = new Uint8ClampedArray(size * size * 4)
  for (let i = 0; i < size * size; i++) data.set(rgba, i * 4)
  const ctx = { drawImage: vi.fn(), getImageData: vi.fn(() => ({ data, width: size, height: size })) }
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AAA')
  return ctx
}

/** Atajos para simular dedos. */
export const finger = (id, x, y) => ({ pointerId: id, clientX: x, clientY: y, pointerType: 'touch' })
