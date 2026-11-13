import { JAR_GRID } from './grid.js'
import styles from './PixelJar.module.css'

/**
 * Frasco pixel que contiene un color: el color es el protagonista.
 * Con `label` es una imagen con nombre accesible ("Rojo #e4002b"); sin `label` es decorativo.
 */
export default function PixelJar({ color, size = 'md', label, pop = false }) {
  const name = label ? `${label}${color ? ` ${color}` : ''}` : undefined
  return (
    <svg
      viewBox={`0 0 12 ${JAR_GRID.length}`}
      shapeRendering="crispEdges"
      role={name ? 'img' : undefined}
      aria-label={name}
      aria-hidden={name ? undefined : true}
      className={styles.jar}
      data-size={size}
      data-pop={pop || undefined}
      style={color ? { '--jar-color': color } : undefined}
    >
      {JAR_GRID.flatMap((row, y) =>
        [...row].flatMap((c, x) => {
          if (c === '.') return []
          const cell = (code, key) => <rect key={key} x={x} y={y} width="1" height="1" className={styles[code]} />
          // el brillo y la sombra se dibujan sobre el color, no en lugar de él
          return c === 'w' || c === 's' ? [cell('c', `${x}-${y}-c`), cell(c, `${x}-${y}`)] : [cell(c, `${x}-${y}`)]
        }),
      )}
    </svg>
  )
}
