import { ICONS } from './icons.js'

/** Íconos de cuadrícula 8x8. Decorativos salvo que se pase `title`. */
export default function PixelIcon({ name, size = 24, title }) {
  const rows = ICONS[name]
  if (!rows) return null
  const cells = []
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      if (row[x] === '#') cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" />)
    }
  })
  return (
    <svg
      viewBox="0 0 8 8"
      width={size}
      height={size}
      fill="currentColor"
      shapeRendering="crispEdges"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {cells}
    </svg>
  )
}
