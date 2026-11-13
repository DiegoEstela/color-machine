import { ColorSwatch, PixelText } from '../../atoms/index.js'
import styles from './ColorCompare.module.css'

/** Tu color objetivo junto al resultado de la mezcla, con qué tan parecidos son. */
export default function ColorCompare({ target, mix, quality, deltaE }) {
  return (
    <div className={styles.root}>
      <div className={styles.pair}>
        <figure className={styles.item}>
          <div className={styles.swatch}><ColorSwatch color={target} size="fill" label="Tu color" /></div>
          <PixelText as="figcaption" size="xs" tone="soft">Tu color</PixelText>
        </figure>
        <figure className={styles.item}>
          <div className={styles.swatch}><ColorSwatch color={mix} size="fill" label="Tu mezcla" /></div>
          <PixelText as="figcaption" size="xs" tone="soft">Tu mezcla</PixelText>
        </figure>
      </div>
      <PixelText size="sm" role="status">
        {quality} <PixelText as="span" size="xs" tone="soft">(ΔE {deltaE.toFixed(1)})</PixelText>
      </PixelText>
    </div>
  )
}
