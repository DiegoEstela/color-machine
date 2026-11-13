import styles from './PixelMeter.module.css'

/** Medidor de segmentos (por ejemplo, qué tan parecida es la mezcla). `level` va de 0 a `max`. */
export default function PixelMeter({ level, max = 4, label, valueText, size = 'md' }) {
  const filled = Math.max(0, Math.min(level, max))
  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={filled}
      aria-valuetext={valueText}
      className={styles.meter}
      data-level={filled}
      data-size={size}
    >
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={styles.segment} data-filled={i < filled || undefined} />
      ))}
    </div>
  )
}
