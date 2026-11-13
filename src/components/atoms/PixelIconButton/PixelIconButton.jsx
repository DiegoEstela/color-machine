import PixelIcon from '../PixelIcon/PixelIcon.jsx'
import styles from './PixelIconButton.module.css'

/**
 * Botón solo con ícono (por ejemplo ⓘ o ✕). Se ve chico (`--visual`) pero responde al toque como uno de 44 px.
 * `label` es obligatorio: es su nombre accesible. Con `hitBias="up"` la zona táctil extra va hacia arriba y no hacia abajo
 * (para cuando debajo hay botones pegados que no deben perder su borde).
 */
export default function PixelIconButton({ icon, label, variant = 'secondary', size = 'md', hitBias = 'center', type = 'button', ...rest }) {
  return (
    <button type={type} aria-label={label} title={label} data-variant={variant} data-size={size} data-hit={hitBias} className={styles.button} {...rest}>
      <PixelIcon name={icon} size={size === 'sm' ? 12 : 16} />
    </button>
  )
}
