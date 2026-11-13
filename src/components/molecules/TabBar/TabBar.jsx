import { PixelIcon } from '../../atoms/index.js'
import { tap } from '../../../lib/haptics.js'
import { TABS } from './tabs.js'
import styles from './TabBar.module.css'

/**
 * Barra de pestañas inferior de la app: Recetas · Crear (central, elevado) · Cuenta.
 * Son enlaces (`#/...`): el botón Atrás funciona y se puede abrir directo.
 */
export default function TabBar({ active }) {
  return (
    <nav className={styles.bar} aria-label="Navegación principal">
      {TABS.map(({ id, label, icon, href, primary }) => (
        <a
          key={id}
          href={href}
          className={styles.tab}
          data-primary={primary || undefined}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => { if (active !== id) tap() }}
        >
          {primary ? (
            <span className={styles.fab}><PixelIcon name={icon} size={22} /></span>
          ) : (
            <PixelIcon name={icon} size={20} />
          )}
          <span className={styles.label}>{label}</span>
        </a>
      ))}
    </nav>
  )
}
