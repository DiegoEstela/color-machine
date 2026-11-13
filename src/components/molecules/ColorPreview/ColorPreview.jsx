import { ColorSwatch, PixelText } from '../../atoms/index.js'
import styles from './ColorPreview.module.css'

/** Vista del color elegido, con la miniatura del recorte al lado si existe. Rellena el alto disponible. */
export default function ColorPreview({ color, thumbnail = null }) {
  if (!color) {
    return (
      <div className={styles.box} data-empty>
        <PixelText variant="body" size="sm" tone="soft">Elegí un color</PixelText>
      </div>
    )
  }
  return (
    <div className={styles.box}>
      {thumbnail && <img src={thumbnail} alt="Recorte de la foto" className={styles.thumb} />}
      <div className={styles.swatch}><ColorSwatch color={color} size="fill" label="Color objetivo" /></div>
    </div>
  )
}
