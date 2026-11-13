import { SPARKLE_GRID } from './grid.js'
import styles from './PixelSparkle.module.css'


/** Destello de 4 puntas. Siempre decorativo; titila salvo con `prefers-reduced-motion`. */
export default function PixelSparkle({ size = 16, tone = 'yellow', delay = 0, still = false, className }) {
  return (
    <svg
      viewBox="0 0 9 9"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      aria-hidden="true"
      className={`${styles.sparkle} ${className ?? ''}`}
      data-tone={tone}
      data-still={still || undefined}
      style={{ '--sparkle-delay': `${delay}ms` }}
    >
      {SPARKLE_GRID.flatMap((row, y) =>
        [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className={styles[c]} />)),
      )}
    </svg>
  )
}
