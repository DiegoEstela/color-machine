import { PixelJar, PixelMeter, PixelSparkle, PixelText } from '../../atoms/index.js'
import { qualityLevel } from '../../../features/color-mixer/solver.js'
import styles from './ColorCompare.module.css'

/**
 * Tu color y el resultado de la mezcla en frascos, con qué tan parecidos son.
 * `compact`: frascos medianos y el parecido en una sola línea (medidor chico + palabra), para el paso 3.
 */
export default function ColorCompare({ target, mix, quality, deltaE, compact = false }) {
  const level = qualityLevel(deltaE)
  const detail = `${quality} (ΔE ${deltaE.toFixed(1)})`
  const jarSize = compact ? 'mid' : 'lg'
  return (
    <div className={styles.root} data-compact={compact || undefined}>
      <div className={styles.pair}>
        <figure className={styles.item}>
          <PixelJar color={target} size={jarSize} label="Tu color" />
          <PixelText as="figcaption" size="xs" tone="soft">Tu color</PixelText>
        </figure>
        <figure className={styles.item}>
          <div className={styles.reveal}>
            <PixelJar color={mix} size={jarSize} label="Tu mezcla" pop />
            <PixelSparkle size={compact ? 14 : 20} tone="yellow" className={styles.s1} delay={0} />
            <PixelSparkle size={compact ? 10 : 14} tone="pink" className={styles.s2} delay={400} />
            <PixelSparkle size={compact ? 12 : 16} tone="blue" className={styles.s3} delay={800} />
          </div>
          <PixelText as="figcaption" size="xs" tone="soft">Tu mezcla</PixelText>
        </figure>
      </div>
      <div className={styles.quality} role="status">
        <div className={styles.meter}>
          <PixelMeter level={level} label="Parecido con tu color" valueText={detail} size={compact ? 'sm' : 'md'} />
        </div>
        <PixelText size="sm">
          {quality}
          {/* el ΔE solo se lee con lector de pantalla */}
          <span className={styles.hidden}> (ΔE {deltaE.toFixed(1)})</span>
        </PixelText>
      </div>
    </div>
  )
}
