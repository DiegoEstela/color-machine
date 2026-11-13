import styles from './PixelBar.module.css'

/** Barra segmentada: `max` segmentos, `value` llenos. */
export default function PixelBar({ value, max, color, label, size = 'md' }) {
  const filled = Math.max(0, Math.min(value, max))
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={filled}
      aria-label={label}
      className={styles.bar}
      data-size={size}
      style={color ? { '--bar-color': color } : undefined}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={styles.segment} data-filled={i < filled || undefined} />
      ))}
    </div>
  )
}
