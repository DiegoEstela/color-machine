import { ColorSwatch, PixelBar, PixelText } from '../../atoms/index.js'
import styles from './RecipeRow.module.css'

/** Una pintura de la receta: color, nombre, cuántas partes y una barra proporcional al total. */
export default function RecipeRow({ name, hex, parts, total }) {
  return (
    <li className={styles.row}>
      <ColorSwatch color={hex} size="sm" label={name} />
      <div className={styles.text}>
        <PixelText as="span" size="sm">{name}</PixelText>
        <PixelText as="span" size="xs" tone="soft">{parts} {parts === 1 ? 'parte' : 'partes'}</PixelText>
      </div>
      <div className={styles.bar}>
        <PixelBar value={parts} max={total} color={hex} label={`${name}: ${parts} de ${total} partes`} size="sm" />
      </div>
    </li>
  )
}
