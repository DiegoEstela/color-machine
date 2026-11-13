import { PixelBar, PixelPanel, PixelText } from '../../atoms/index.js'
import styles from './WizardLayout.module.css'

/** Estructura de cada paso del asistente: indicador de progreso, título y contenido. */
export default function WizardLayout({ step, total, title, children }) {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <PixelText size="xs" tone="soft">Paso {step} de {total}</PixelText>
        <PixelBar value={step} max={total} label={`Paso ${step} de ${total}`} />
        <PixelText as="h1" size="lg">{title}</PixelText>
      </header>
      <PixelPanel padding="lg">{children}</PixelPanel>
    </main>
  )
}
