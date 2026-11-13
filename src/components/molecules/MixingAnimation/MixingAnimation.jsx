import { PixelSparkle, PixelText } from '../../atoms/index.js'
import styles from './MixingAnimation.module.css'

const BUBBLES = 6

/**
 * Olla pixel art con burbujas mientras se calcula la mezcla.
 * Con `prefers-reduced-motion` las animaciones se desactivan (global.css) y queda estática.
 */
export default function MixingAnimation({ colors = [] }) {
  return (
    <div className={styles.root} role="status" aria-live="polite">
      <div className={styles.pot} aria-hidden="true">
        <div className={styles.liquid}>
          {colors.slice(0, 4).map((c, i) => (
            <span key={i} className={styles.layer} style={{ '--layer-color': c }} />
          ))}
        </div>
        <PixelSparkle size={14} tone="pink" className={styles.s1} />
        <PixelSparkle size={12} tone="blue" className={styles.s2} delay={500} />
        {Array.from({ length: BUBBLES }, (_, i) => (
          <span key={i} className={styles.bubble} style={{ '--i': i }} />
        ))}
      </div>
      <PixelText size="sm">Mezclando...</PixelText>
    </div>
  )
}
