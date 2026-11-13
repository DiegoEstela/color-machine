import { useCallback, useEffect, useRef, useState } from 'react'
import { averageRect } from '../../../lib/color.js'
import { defaultRect, moveRect, resizeRect } from '../../../lib/crop.js'
import { sampleCrop } from '../../../lib/image.js'
import { useImageCanvas } from '../../../hooks/useImageCanvas.js'
import PhotoViewport from '../PhotoViewport/PhotoViewport.jsx'
import styles from './PhotoCropper.module.css'

const FULL = { x: 0, y: 0, w: 1, h: 1 }
const HANDLES = ['nw', 'ne', 'sw', 'se']

/**
 * Foto con un rectángulo movible y redimensionable, y con zoom para encuadrar con precisión.
 * Emite `onChange({ hex, thumbnail })` cada vez que cambia el recorte (y al cargar la foto).
 * El color es el promedio recortado de la zona, calculado siempre sobre la foto original.
 */
export default function PhotoCropper({ file, onChange, onError }) {
  const { canvasRef, ready } = useImageCanvas(file, onError)
  const [rect, setRect] = useState(defaultRect)
  const dragRef = useRef(null)

  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  // Cada cambio de recorte (o foto nueva) recalcula color y miniatura.
  useEffect(() => {
    if (!ready || !canvasRef.current) return
    const { imageData, thumbnail } = sampleCrop(canvasRef.current, rect)
    const hex = averageRect(imageData, FULL)
    if (hex) onChangeRef.current?.({ hex, thumbnail })
  }, [ready, rect, canvasRef])

  // Los desplazamientos del dedo (píxeles de pantalla) se pasan a coordenadas de la foto dividiendo por el zoom.
  const dragProps = useCallback((mode, api) => ({
    onPointerDown: (e) => {
      if (api.isGesturing()) return
      e.stopPropagation() // una esquina no debe mover también el recuadro
      e.currentTarget.setPointerCapture?.(e.pointerId)
      dragRef.current = { mode, x: e.clientX, y: e.clientY, start: rect }
    },
    onPointerMove: (e) => {
      const drag = dragRef.current
      if (!drag || drag.mode !== mode) return
      if (api.isGesturing()) { dragRef.current = null; return } // un segundo dedo cancela el arrastre
      const { w, h, scale } = api.getMetrics()
      if (!w || !h) return
      const dx = (e.clientX - drag.x) / (w * scale)
      const dy = (e.clientY - drag.y) / (h * scale)
      setRect(mode === 'move' ? moveRect(drag.start, dx, dy) : resizeRect(drag.start, mode, dx, dy))
    },
    onPointerUp: () => { dragRef.current = null },
    onPointerCancel: () => { dragRef.current = null },
  }), [rect])

  if (!file) return null

  const pct = (v) => `${v * 100}%`

  return (
    <PhotoViewport canvasRef={canvasRef} ready={ready} resetKey={file} label="Tu foto con el recorte">
      {(api) => (
        <div
          className={styles.box}
          data-testid="crop-box"
          data-own-gesture="drag"
          style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }}
          {...dragProps('move', api)}
        >
          {HANDLES.map((h) => (
            <span key={h} className={styles.handle} data-handle={h} data-own-gesture="drag" {...dragProps(h, api)} />
          ))}
        </div>
      )}
    </PhotoViewport>
  )
}
