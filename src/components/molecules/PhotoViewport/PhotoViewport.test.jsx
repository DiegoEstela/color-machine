import { createRef } from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { PhotoViewport } from '../index.js'
import { finger, mockFrameRect, mockStageSize, viewportParts } from '../../../test-utils/photoMocks.js'

let restore
// Reloj controlado: `performance.now()` solo avanza cuando el test lo pide, así los toques y dobles toques
// no dependen de la velocidad de la máquina.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['performance'] })
  restore = mockStageSize(200, 100)
})
afterEach(() => {
  restore()
  vi.useRealTimers()
})

function setup(props = {}) {
  const canvasRef = createRef()
  const onTap = vi.fn()
  const apiRef = { current: null }
  const utils = render(
    <PhotoViewport canvasRef={canvasRef} ready resetKey="a" onTap={onTap} label="Foto de prueba" {...props}>
      {(api) => { apiRef.current = api; return <span data-testid="overlay" /> }}
    </PhotoViewport>,
  )
  const parts = viewportParts(utils.container)
  mockFrameRect(parts.frame)
  return { ...utils, ...parts, onTap, canvasRef, apiRef }
}
const zoomIn = () => fireEvent.click(screen.getByRole('button', { name: 'Acercar' }))

describe('PhotoViewport', () => {
  it('muestra la foto como imagen con nombre accesible', () => {
    setup()
    expect(screen.getByRole('img', { name: 'Foto de prueba' })).toBeInTheDocument()
  })

  it('sin foto lista no muestra los botones de zoom ni la capa superpuesta', () => {
    setup({ ready: false })
    expect(screen.queryByRole('group', { name: 'Zoom de la foto' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('overlay')).not.toBeInTheDocument()
  })

  it('empieza en 1× con los botones de alejar y volver deshabilitados', () => {
    const { scale } = setup()
    expect(scale).toBe(1)
    expect(screen.getByRole('button', { name: 'Alejar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Volver al tamaño original/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeEnabled()
  })

  it('el botón del medio muestra el nivel de zoom y vuelve a 1×', () => {
    const { container } = setup()
    zoomIn()
    expect(screen.getByRole('button', { name: 'Zoom 1.5×. Volver al tamaño original' })).toHaveTextContent('1.5×')
    zoomIn()
    expect(viewportParts(container).scale).toBe(2.25)
    fireEvent.click(screen.getByRole('button', { name: /Volver al tamaño original/ }))
    expect(viewportParts(container)).toMatchObject({ scale: 1, x: 0, y: 0 })
  })

  it('los botones llegan a los límites de 1× y 8×', () => {
    const { container } = setup()
    for (let i = 0; i < 12; i++) zoomIn()
    expect(viewportParts(container).scale).toBe(8)
    expect(screen.getByRole('button', { name: 'Acercar' })).toBeDisabled()
    for (let i = 0; i < 12; i++) fireEvent.click(screen.getByRole('button', { name: 'Alejar' }))
    expect(viewportParts(container).scale).toBe(1)
  })

  it('la capa superpuesta recibe las medidas y la escala actuales, y la variable --zoom', () => {
    const { container, stage, apiRef } = setup()
    expect(apiRef.current.getMetrics()).toEqual({ w: 200, h: 100, scale: 1 })
    zoomIn()
    expect(apiRef.current.getMetrics()).toEqual({ w: 200, h: 100, scale: 1.5 })
    expect(stage.style.getPropertyValue('--zoom')).toBe('1.5')
    expect(viewportParts(container).scale).toBe(1.5)
  })

  it('el marco no se transforma ni cambia: solo el escenario con la foto', () => {
    const { frame, container } = setup()
    zoomIn()
    zoomIn()
    expect(frame.style.transform).toBe('')
    expect(frame.style.width).toBe('')
    expect(viewportParts(container).scale).toBe(2.25)
  })

  it('un toque corto avisa el punto en coordenadas de la foto', () => {
    const { frame, onTap } = setup()
    fireEvent.pointerDown(frame, finger(1, 50, 25))
    fireEvent.pointerUp(frame, finger(1, 50, 25))
    expect(onTap).toHaveBeenCalledTimes(1)
    expect(onTap.mock.calls[0][0]).toEqual({ x: 0.25, y: 0.25 })
  })

  it('con zoom el toque se convierte a coordenadas de la foto original', () => {
    const { frame, onTap } = setup()
    zoomIn(); zoomIn() // 2.25× centrado: x = -125, y = -62.5
    fireEvent.pointerDown(frame, finger(1, 50, 50))
    fireEvent.pointerUp(frame, finger(1, 50, 50))
    const p = onTap.mock.calls[0][0]
    expect(p.x).toBeCloseTo(175 / 450, 6)
    expect(p.y).toBeCloseTo(0.5, 6)
  })

  it('mantener apretado mucho tiempo sin moverse no cuenta como toque', () => {
    const { frame, onTap } = setup()
    fireEvent.pointerDown(frame, finger(1, 50, 25))
    vi.advanceTimersByTime(700)
    fireEvent.pointerUp(frame, finger(1, 50, 25))
    expect(onTap).not.toHaveBeenCalled()
  })

  it('dos toques separados por más de 300 ms no son un doble toque', () => {
    const { frame, onTap, container } = setup()
    const tap = () => { fireEvent.pointerDown(frame, finger(1, 100, 50)); fireEvent.pointerUp(frame, finger(1, 100, 50)) }
    tap()
    vi.advanceTimersByTime(400)
    tap()
    expect(viewportParts(container).scale).toBe(1)
    expect(onTap).toHaveBeenCalledTimes(2)
  })

  it('dos toques lejos uno del otro no son un doble toque', () => {
    const { frame, container } = setup()
    fireEvent.pointerDown(frame, finger(1, 20, 20)); fireEvent.pointerUp(frame, finger(1, 20, 20))
    vi.advanceTimersByTime(100)
    fireEvent.pointerDown(frame, finger(1, 150, 80)); fireEvent.pointerUp(frame, finger(1, 150, 80))
    expect(viewportParts(container).scale).toBe(1)
  })

  it('un arrastre mueve la foto y no cuenta como toque', () => {
    const { frame, onTap, container } = setup()
    zoomIn(); zoomIn()
    const before = viewportParts(container)
    fireEvent.pointerDown(frame, finger(1, 100, 50))
    fireEvent.pointerMove(frame, finger(1, 130, 50)) // pasa el umbral: empieza el arrastre
    fireEvent.pointerMove(frame, finger(1, 150, 50))
    fireEvent.pointerUp(frame, finger(1, 150, 50))
    expect(viewportParts(container).x).toBeGreaterThan(before.x)
    expect(onTap).not.toHaveBeenCalled()
  })

  it('un temblor chico del dedo no mueve la foto y sigue siendo un toque', () => {
    const { frame, onTap, container } = setup()
    zoomIn(); zoomIn()
    const before = viewportParts(container)
    fireEvent.pointerDown(frame, finger(1, 100, 50))
    fireEvent.pointerMove(frame, finger(1, 104, 52))
    fireEvent.pointerUp(frame, finger(1, 104, 52))
    expect(viewportParts(container).x).toBe(before.x)
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  it('la foto no se puede arrastrar más allá de sus bordes', () => {
    const { frame, container } = setup()
    zoomIn(); zoomIn()
    fireEvent.pointerDown(frame, finger(1, 100, 50))
    fireEvent.pointerMove(frame, finger(1, 140, 50))
    fireEvent.pointerMove(frame, finger(1, 1400, 50))
    fireEvent.pointerUp(frame, finger(1, 1400, 50))
    expect(viewportParts(container).x).toBe(0)
  })

  it('el pellizco con dos dedos acerca y no es un toque', () => {
    const { frame, onTap, container } = setup()
    fireEvent.pointerDown(frame, finger(1, 60, 50))
    fireEvent.pointerDown(frame, finger(2, 140, 50))
    fireEvent.pointerMove(frame, finger(2, 180, 50)) // la distancia pasa de 80 a 120
    expect(viewportParts(container).scale).toBeCloseTo(1.5, 6)
    fireEvent.pointerUp(frame, finger(2, 180, 50))
    fireEvent.pointerUp(frame, finger(1, 60, 50))
    expect(onTap).not.toHaveBeenCalled()
  })

  it('al juntar los dedos aleja, sin bajar de 1×', () => {
    const { frame, container } = setup()
    zoomIn(); zoomIn()
    fireEvent.pointerDown(frame, finger(1, 40, 50))
    fireEvent.pointerDown(frame, finger(2, 160, 50))
    fireEvent.pointerMove(frame, finger(2, 45, 50))
    expect(viewportParts(container).scale).toBe(1)
  })

  it('tras un pellizco, el dedo que queda no mueve la foto ni cuenta como toque', () => {
    const { frame, onTap, container } = setup()
    fireEvent.pointerDown(frame, finger(1, 60, 50))
    fireEvent.pointerDown(frame, finger(2, 140, 50))
    fireEvent.pointerMove(frame, finger(2, 180, 50))
    fireEvent.pointerUp(frame, finger(2, 180, 50))
    const afterPinch = viewportParts(container)
    fireEvent.pointerMove(frame, finger(1, 100, 80))
    fireEvent.pointerUp(frame, finger(1, 100, 80))
    expect(viewportParts(container)).toEqual(afterPinch)
    expect(onTap).not.toHaveBeenCalled()
  })

  it('el doble toque acerca a 3× y otro doble toque vuelve a 1×', () => {
    const { frame, container } = setup()
    const tap = () => { fireEvent.pointerDown(frame, finger(1, 100, 50)); fireEvent.pointerUp(frame, finger(1, 100, 50)) }
    tap(); tap()
    expect(viewportParts(container).scale).toBe(3)
    expect(viewportParts(container).stage.hasAttribute('data-pixelated')).toBe(true) // se ven los píxeles
    tap(); tap()
    expect(viewportParts(container).scale).toBe(1)
    expect(viewportParts(container).stage.hasAttribute('data-pixelated')).toBe(false)
  })

  it('la rueda del mouse acerca y no hace scroll de la página', () => {
    const { frame, container } = setup()
    const notPrevented = fireEvent.wheel(frame, { deltaY: -300, clientX: 100, clientY: 50 })
    expect(notPrevented).toBe(false) // preventDefault → la página no se mueve
    expect(viewportParts(container).scale).toBeGreaterThan(1)
    fireEvent.wheel(frame, { deltaY: 3000, clientX: 100, clientY: 50 })
    expect(viewportParts(container).scale).toBe(1)
  })

  it('bloquea el zoom de la página que hace Safari en iPhone (gestos)', () => {
    const { frame } = setup()
    for (const name of ['gesturestart', 'gesturechange', 'gestureend']) {
      const event = new Event(name, { cancelable: true, bubbles: true })
      frame.dispatchEvent(event)
      expect(event.defaultPrevented, name).toBe(true)
    }
  })

  it('cambiar de foto (resetKey) vuelve a 1×', () => {
    const canvasRef = createRef()
    const { container, rerender } = render(<PhotoViewport canvasRef={canvasRef} ready resetKey="a" label="x" />)
    zoomIn()
    expect(viewportParts(container).scale).toBe(1.5)
    rerender(<PhotoViewport canvasRef={canvasRef} ready resetKey="b" label="x" />)
    expect(viewportParts(container).scale).toBe(1)
  })

  it('los botones de zoom tienen nombre accesible y se activan con el teclado', () => {
    const { container } = setup()
    const plus = screen.getByRole('button', { name: 'Acercar' })
    plus.focus()
    expect(plus).toHaveFocus()
    fireEvent.click(plus) // Enter o Espacio sobre un botón dispara click
    expect(viewportParts(container).scale).toBe(1.5)
  })

  it('tocar un botón de zoom no cuenta como toque en la foto', () => {
    const { onTap } = setup()
    const plus = screen.getByRole('button', { name: 'Acercar' })
    fireEvent.pointerDown(plus, finger(1, 190, 90))
    fireEvent.pointerUp(plus, finger(1, 190, 90))
    expect(onTap).not.toHaveBeenCalled()
  })
})
