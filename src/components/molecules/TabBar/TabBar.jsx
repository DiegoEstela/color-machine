import { PixelIcon } from '../../atoms/index.js'
import { TABS } from './tabs.js'
import styles from './TabBar.module.css'

/** Barra de pestañas inferior de la app. Son enlaces (`#/...`): el botón Atrás funciona y se puede abrir directo. */
export default function TabBar({ active }) {
  return (
    <nav className={styles.bar} aria-label="Navegación principal">
      {TABS.map(({ id, label, icon, href }) => (
        <a key={id} href={href} className={styles.tab} aria-current={active === id ? 'page' : undefined}>
          <PixelIcon name={icon} size={20} />
          <span className={styles.label}>{label}</span>
        </a>
      ))}
    </nav>
  )
}
