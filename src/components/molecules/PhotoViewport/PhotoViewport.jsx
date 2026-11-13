import { PixelIcon } from '../../atoms/index.js'
import { usePanZoom } from '../../../hooks/usePanZoom.js'
import { MAX_SCALE, MIN_SCALE, formatZoom } from '../../../lib/zoom.js'
import styles from './PhotoViewport.module.css'

/**
 * Marco de tamaño fijo con la foto adentro. Se puede acercar (pellizco, rueda, doble toque o botones)
 * y mover la foto, pero el marco y el resto de la pantalla no cambian de tamaño.
 * - `canvasRef`: el canvas con la foto (ver `useImageCanvas`). `ready`: la foto ya se dibujó.
 * - `resetKey`: al cambiar (otra foto) vuelve a 1×.
 * - `onTap(punto)`: toque corto, con el punto en coordenadas normalizadas de la foto (0–1).
 * - `children(api)`: capa dentro de la foto (recuadro, mira). Se mueve y escala con la foto; usá la variable
 *   CSS `--zoom` para que bordes y tiradores no se agranden. `api.getMetrics()` da { w, h, scale }.
 */
export default function PhotoViewport({ canvasRef, ready, resetKey, onTap, label, children }) {
  const { frameRef, stageRef, transform, zoomIn, zoomOut, reset, api, handlers } = usePanZoom({ resetKey, onTap })
  const { scale, x, y } = transform
  const zoomText = formatZoom(scale)

  return (
    <div ref={frameRef} className={styles.frame} data-zoomed={scale > 1.01 || undefined} {...handlers}>
      <div
        ref={stageRef}
        className={styles.stage}
        data-pixelated={scale >= 3 || undefined}
        style={{ transform: `translate(${x}px, ${y}px) scale(${scale})`, '--zoom': scale }}
      >
        <canvas ref={canvasRef} className={styles.canvas} role="img" aria-label={label} />
        {ready && children?.(api)}
      </div>
      {ready && (
        <div className={styles.controls} role="group" aria-label="Zoom de la foto">
          <button type="button" className={styles.control} data-own-gesture aria-label="Alejar" disabled={scale <= MIN_SCALE} onClick={zoomOut}>
            <PixelIcon name="minus" size={16} />
          </button>
          <button
            type="button"
            className={styles.control}
            data-own-gesture
            data-wide
            aria-label={`Zoom ${zoomText}. Volver al tamaño original`}
            disabled={scale <= MIN_SCALE}
            onClick={reset}
          >
            {zoomText}
          </button>
          <button type="button" className={styles.control} data-own-gesture aria-label="Acercar" disabled={scale >= MAX_SCALE} onClick={zoomIn}>
            <PixelIcon name="plus" size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
