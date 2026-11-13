import { LOGO_GRID } from './grid.js'
import styles from './PixelLogo.module.css'


/** Logo: una olla de pintura con gotas cayendo. Decorativo salvo que se pase `title`. */
export default function PixelLogo({ size = 32, title }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={styles.logo}
    >
      {LOGO_GRID.flatMap((row, y) =>
        [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" className={styles[c]} />)),
      )}
    </svg>
  )
}
