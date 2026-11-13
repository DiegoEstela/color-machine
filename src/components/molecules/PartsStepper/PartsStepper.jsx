import { PixelIconButton, PixelText } from '../../atoms/index.js'
import styles from './PartsStepper.module.css'

/**
 * Cuántas partes lleva una pintura: − número +. Cada botón se ve chico pero responde como 44 px.
 * `name` es la pintura (entra en el nombre accesible de los botones). `onChange(delta)` recibe -1 o +1.
 */
export default function PartsStepper({ name, parts, min = 1, max = 20, onChange }) {
  return (
    <div className={styles.root} role="group" aria-label={`Partes de ${name}`}>
      <PixelIconButton icon="minus" label={`Quitar una parte de ${name}`} disabled={parts <= min} onClick={() => onChange(-1)} />
      <PixelText as="span" size="sm" className={styles.value} role="status" aria-label={`${parts} ${parts === 1 ? 'parte' : 'partes'}`}>
        {parts}
      </PixelText>
      <PixelIconButton icon="plus" label={`Sumar una parte de ${name}`} disabled={parts >= max} onClick={() => onChange(1)} />
    </div>
  )
}
