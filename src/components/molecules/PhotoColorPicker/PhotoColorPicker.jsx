import { useState } from 'react'
import { averageRegion } from '../../../lib/color.js'
import { useImageCanvas } from '../../../hooks/useImageCanvas.js'
import styles from './PhotoColorPicker.module.css'

const SAMPLE_RADIUS = 2 // región de 5x5 px

/** Muestra la foto y, al tocar un punto, entrega el color promedio de su entorno. */
export default function PhotoColorPicker({ file, onPick, onError }) {
  const { canvasRef, ready } = useImageCanvas(file, onError)
  // Se guarda a qué archivo pertenece la marca, así cambiar de foto la invalida sin efectos extra.
  const [markState, setMarkState] = useState(null)
  const mark = markState?.file === file ? markState : null

  if (!file) return null

  const handleTap = (e) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !ready) return
    const rect = canvas.getBoundingClientRect()
    const x = Math.round(((e.clientX - rect.left) / rect.width) * canvas.width)
    const y = Math.round(((e.clientY - rect.top) / rect.height) * canvas.height)
    const sx = Math.max(0, x - SAMPLE_RADIUS)
    const sy = Math.max(0, y - SAMPLE_RADIUS)
    const sw = Math.min(canvas.width, x + SAMPLE_RADIUS + 1) - sx
    const sh = Math.min(canvas.height, y + SAMPLE_RADIUS + 1) - sy
    if (sw <= 0 || sh <= 0) return
    const hex = averageRegion(ctx.getImageData(sx, sy, sw, sh), x - sx, y - sy, SAMPLE_RADIUS)
    if (!hex) return
    setMarkState({ file, left: (x / canvas.width) * 100, top: (y / canvas.height) * 100 })
    onPick(hex)
  }

  return (
    <div className={styles.frame}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        onClick={handleTap}
        role="img"
        aria-label="Tu foto: tocá un punto para tomar su color"
      />
      {mark && <span className={styles.crosshair} style={{ left: `${mark.left}%`, top: `${mark.top}%` }} />}
    </div>
  )
}
