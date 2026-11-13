import { PixelIcon } from '../../atoms/index.js'
import styles from './StepIndicator.module.css'

const STEPS = [
  { icon: 'wheel', label: 'Color' },
  { icon: 'jar', label: 'Pinturas' },
  { icon: 'pot', label: 'Mezcla' },
]

/** Pasos del asistente con íconos: hechos (✓), actual (resaltado) y pendientes, unidos por una línea. */
export default function StepIndicator({ step, total = STEPS.length, compact = false }) {
  return (
    <ol className={styles.steps} data-compact={compact || undefined} aria-label={`Paso ${step} de ${total}`}>
      {STEPS.slice(0, total).map(({ icon, label }, i) => {
        const n = i + 1
        const state = n < step ? 'done' : n === step ? 'current' : 'pending'
        return (
          <li key={label} className={styles.step} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
            <span className={styles.badge}>
              <PixelIcon name={state === 'done' ? 'check' : icon} size={compact ? 14 : 16} />
            </span>
            <span className={styles.hidden}>{label}</span>
          </li>
        )
      })}
      <span className={styles.hidden}>Paso {step} de {total}</span>
    </ol>
  )
}
