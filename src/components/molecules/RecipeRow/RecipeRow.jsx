import { PixelBar, PixelButton, PixelIconButton, PixelJar, PixelText } from '../../atoms/index.js'
import styles from './RecipeRow.module.css'

/**
 * Una pintura de la receta: color, nombre, cuántas partes y una barra proporcional al total.
 * Si es una pintura `standard` (sumada desde el paso 3) lleva la etiqueta "estándar" y dos acciones:
 * "Usar la mía" (`onUseMine`) y quitarla (`onRemove`).
 */
export default function RecipeRow({ name, hex, parts, total, standard = false, onUseMine, onRemove }) {
  return (
    <li className={styles.row} data-standard={standard || undefined}>
      <PixelJar color={hex} size="sm" label={name} />
      <div className={styles.text}>
        <PixelText as="span" size="sm">{name}</PixelText>
        <span className={styles.meta}>
          <PixelText as="span" size="xs" tone="soft">{parts} {parts === 1 ? 'parte' : 'partes'}</PixelText>
          {standard && <span className={styles.tag}>estándar</span>}
        </span>
      </div>
      <div className={styles.bar}>
        <PixelBar value={parts} max={total} color={hex} label={`${name}: ${parts} de ${total} partes`} size="sm" />
      </div>
      {standard && (
        <div className={styles.actions}>
          <PixelButton size="sm" variant="secondary" onClick={onUseMine}>Usar la mía</PixelButton>
          <PixelIconButton icon="cross" size="sm" variant="danger" label={`Quitar ${name}`} onClick={onRemove} />
        </div>
      )}
    </li>
  )
}
