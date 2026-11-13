import { PixelIconButton, PixelJar, PixelText } from '../../atoms/index.js'
import PartsStepper from '../PartsStepper/PartsStepper.jsx'
import styles from './EditableRecipeRow.module.css'

/**
 * Una pintura de la receta que se está editando: color, nombre, − / + partes, quitarla y una barra de proporción.
 * `total` = suma de partes de toda la receta (para la barra). `canRemove` = false si es la única pintura.
 */
export default function EditableRecipeRow({ name, hex, parts, total, canRemove = true, onChangeParts, onRemove }) {
  const pct = total > 0 ? Math.round((parts / total) * 100) : 0
  return (
    <li className={styles.row}>
      <div className={styles.top}>
        <PixelJar color={hex} size="sm" label={name} />
        <PixelText as="span" size="sm" className={styles.name}>{name}</PixelText>
        <PartsStepper name={name} parts={parts} onChange={onChangeParts} />
        <PixelIconButton icon="cross" size="sm" variant="danger" label={`Quitar ${name}`} disabled={!canRemove} onClick={onRemove} />
      </div>
      <div className={styles.bar} aria-hidden="true">
        <span className={styles.fill} style={{ width: `${pct}%`, '--bar-color': hex }} />
      </div>
    </li>
  )
}
