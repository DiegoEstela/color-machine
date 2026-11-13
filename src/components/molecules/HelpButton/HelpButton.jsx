import { PixelIconButton } from '../../atoms/index.js'
import styles from './HelpButton.module.css'

/**
 * Botón "?" de ayuda, siempre a mano: flota abajo a la derecha, apoyado sobre la barra de pestañas (se posiciona respecto
 * de la pantalla de la app, `AppShell`). Se ve de 34 px y responde como 44 px.
 */
export default function HelpButton({ onClick }) {
  return (
    <div className={styles.slot}>
      <PixelIconButton icon="help" label="Ayuda" variant="primary" style={{ '--visual': '34px' }} onClick={onClick} />
    </div>
  )
}
