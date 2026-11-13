import { useCallback, useEffect, useRef, useState } from 'react'
import { averageRect } from '../../../lib/color.js'
import { defaultRect, moveRect, resizeRect } from '../../../lib/crop.js'
import { sampleCrop } from '../../../lib/image.js'
import { useImageCanvas } from '../../../hooks/useImageCanvas.js'
import styles from './PhotoCropper.module.css'

const FULL = { x: 0, y: 0, w: 1, h: 1 }
const HANDLES = ['nw', 'ne', 'sw', 'se']

/**
 * Foto con un rectángulo movible y redimensionable. Emite `onChange({ hex, thumbnail })`
 * cada vez que cambia el recorte (y al cargar la foto). El color es el promedio recortado de la zona.
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

  const dragProps = useCallback((mode) => ({
    onPointerDown: (e) => {
      e.stopPropagation()
      e.currentTarget.setPointerCapture?.(e.pointerId)
      dragRef.current = { mode, x: e.clientX, y: e.clientY, start: rect }
    },
    onPointerMove: (e) => {
      const drag = dragRef.current
      if (!drag || drag.mode !== mode) return
      const bounds = canvasRef.current.getBoundingClientRect()
      const dx = (e.clientX - drag.x) / bounds.width
      const dy = (e.clientY - drag.y) / bounds.height
      setRect(mode === 'move' ? moveRect(drag.start, dx, dy) : resizeRect(drag.start, mode, dx, dy))
    },
    onPointerUp: () => { dragRef.current = null },
    onPointerCancel: () => { dragRef.current = null },
  }), [rect, canvasRef])

  if (!file) return null

  const pct = (v) => `${v * 100}%`

  return (
    <div className={styles.frame}>
      <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label="Tu foto con el recorte" />
      {ready && (
        <div className={styles.overlay}>
          <div
            className={styles.box}
            data-testid="crop-box"
            style={{ left: pct(rect.x), top: pct(rect.y), width: pct(rect.w), height: pct(rect.h) }}
            {...dragProps('move')}
          >
            {HANDLES.map((h) => (
              <span key={h} className={styles.handle} data-handle={h} {...dragProps(h)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
