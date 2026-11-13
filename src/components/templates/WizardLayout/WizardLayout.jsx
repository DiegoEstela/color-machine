import { PixelBar, PixelIcon, PixelPanel, PixelText } from '../../atoms/index.js'
import styles from './WizardLayout.module.css'

/**
 * Estructura de cada paso del asistente: título chico, progreso y contenido.
 * Si se pasa `onSignOut` aparece un botón de ícono discreto para cerrar sesión.
 */
export default function WizardLayout({ step, total, title, onSignOut, children }) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.row}>
          <PixelText as="h1" size="sm">{title}</PixelText>
          <div className={styles.meta}>
            <PixelText as="span" size="xs" tone="soft">
              <span className={styles.hidden}>Paso {step} de {total}</span>
              <span aria-hidden="true">{step}/{total}</span>
            </PixelText>
            {onSignOut && (
              <button type="button" className={styles.exit} aria-label="Cerrar sesión" title="Cerrar sesión" onClick={onSignOut}>
                <PixelIcon name="exit" size={20} />
              </button>
            )}
          </div>
        </div>
        <PixelBar value={step} max={total} label={`Paso ${step} de ${total}`} size="sm" />
      </header>
      <PixelPanel padding="sm">{children}</PixelPanel>
    </main>
  )
}
