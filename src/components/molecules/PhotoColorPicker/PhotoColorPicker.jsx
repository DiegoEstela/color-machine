import { useState } from 'react'
import { averageRegion } from '../../../lib/color.js'
import { useImageCanvas } from '../../../hooks/useImageCanvas.js'
import PhotoViewport from '../PhotoViewport/PhotoViewport.jsx'
import styles from './PhotoColorPicker.module.css'

const SAMPLE_RADIUS = 2 // región de 5x5 px

/**
 * Muestra la foto (con zoom) y, al tocar un punto, entrega el color promedio de su entorno.
 * Un toque elige el color; un arrastre mueve la foto. El color sale de la foto original, no de lo que se ve.
 */
export default function PhotoColorPicker({ file, onPick, onError }) {
  const { canvasRef, ready } = useImageCanvas(file, onError)
  // Se guarda a qué archivo pertenece la marca, así cambiar de foto la invalida sin efectos extra.
  const [markState, setMarkState] = useState(null)
  const mark = markState?.file === file ? markState : null

  if (!file) return null

  /** `point` = punto tocado en coordenadas normalizadas de la foto (0–1). */
  const handleTap = (point) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !ready) return
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return
    const x = Math.min(canvas.width - 1, Math.round(point.x * canvas.width))
    const y = Math.min(canvas.height - 1, Math.round(point.y * canvas.height))
    const sx = Math.max(0, x - SAMPLE_RADIUS)
    const sy = Math.max(0, y - SAMPLE_RADIUS)
    const sw = Math.min(canvas.width, x + SAMPLE_RADIUS + 1) - sx
    const sh = Math.min(canvas.height, y + SAMPLE_RADIUS + 1) - sy
    if (sw <= 0 || sh <= 0) return
    const hex = averageRegion(ctx.getImageData(sx, sy, sw, sh), x - sx, y - sy, SAMPLE_RADIUS)
    if (!hex) return
    setMarkState({ file, left: point.x * 100, top: point.y * 100 })
    onPick(hex)
  }

  return (
    <PhotoViewport
      canvasRef={canvasRef}
      ready={ready}
      resetKey={file}
      onTap={handleTap}
      label="Tu foto: tocá un punto para tomar su color"
    >
      {() => mark && <span className={styles.crosshair} style={{ left: `${mark.left}%`, top: `${mark.top}%` }} />}
    </PhotoViewport>
  )
}
