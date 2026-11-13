import { PixelJar, PixelMeter, PixelSparkle, PixelText } from '../../atoms/index.js'
import { qualityLevel } from '../../../features/color-mixer/solver.js'
import styles from './ColorCompare.module.css'

/** Tu color y el resultado de la mezcla en frascos, con un medidor de qué tan parecidos son. */
export default function ColorCompare({ target, mix, quality, deltaE }) {
  const level = qualityLevel(deltaE)
  const detail = `${quality} (ΔE ${deltaE.toFixed(1)})`
  return (
    <div className={styles.root}>
      <div className={styles.pair}>
        <figure className={styles.item}>
          <PixelJar color={target} size="lg" label="Tu color" />
          <PixelText as="figcaption" size="xs" tone="soft">Tu color</PixelText>
        </figure>
        <figure className={styles.item}>
          <div className={styles.reveal}>
            <PixelJar color={mix} size="lg" label="Tu mezcla" pop />
            <PixelSparkle size={20} tone="yellow" className={styles.s1} delay={0} />
            <PixelSparkle size={14} tone="pink" className={styles.s2} delay={400} />
            <PixelSparkle size={16} tone="blue" className={styles.s3} delay={800} />
          </div>
          <PixelText as="figcaption" size="xs" tone="soft">Tu mezcla</PixelText>
        </figure>
      </div>
      <div className={styles.quality} role="status">
        <PixelMeter level={level} label="Parecido con tu color" valueText={detail} />
        <PixelText size="sm">
          {quality}
          {/* el ΔE solo se lee con lector de pantalla */}
          <span className={styles.hidden}> (ΔE {deltaE.toFixed(1)})</span>
        </PixelText>
      </div>
    </div>
  )
}
