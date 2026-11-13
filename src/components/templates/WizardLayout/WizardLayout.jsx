import { PixelIcon, PixelLogo, PixelPanel, PixelText } from '../../atoms/index.js'
import { StepIndicator } from '../../molecules/index.js'
import styles from './WizardLayout.module.css'

/**
 * Cada paso del asistente es una "ventana": barra de título con el logo y el nombre del paso,
 * indicador de pasos con íconos y el contenido. Con `onSignOut` hay un botón de ícono para cerrar sesión.
 */
export default function WizardLayout({ step, total, title, onSignOut, children }) {
  const exit = onSignOut && (
    <button type="button" className={styles.exit} aria-label="Cerrar sesión" title="Cerrar sesión" onClick={onSignOut}>
      <PixelIcon name="exit" size={20} />
    </button>
  )
  return (
    <main className={styles.page}>
      <PixelPanel
        padding="sm"
        title={<><PixelLogo size={24} /><PixelText as="h1" size="sm">{title}</PixelText></>}
        actions={exit}
      >
        <div className={styles.content}>
          <StepIndicator step={step} total={total} />
          {children}
        </div>
      </PixelPanel>
    </main>
  )
}
