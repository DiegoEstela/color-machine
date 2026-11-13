import { useEffect, useRef } from 'react'
import { PixelIcon, PixelLogo, PixelText } from '../../atoms/index.js'
import { TabBar } from '../../molecules/index.js'
import styles from './AppShell.module.css'

/**
 * Estructura de app a pantalla completa: barra superior (48 px), contenido con su propio scroll y barra de
 * pestañas inferior (56 px). Los dos extremos tienen siempre el mismo alto, más la zona segura del teléfono.
 * - `title`: título de la pantalla. `actions`: lo que va a la derecha de la barra (por ejemplo, los pasos).
 * - `back`: `{ href, label }` muestra una flecha para volver en lugar del logo.
 * - `activeTab`: pestaña resaltada. `scrollKey`: al cambiar, el contenido vuelve arriba (por ejemplo, el paso).
 */
export default function AppShell({ title, actions, back, activeTab, scrollKey, children }) {
  const contentRef = useRef(null)
  useEffect(() => { contentRef.current?.scrollTo?.(0, 0) }, [scrollKey])

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        {back ? (
          <a href={back.href} className={styles.back} aria-label={back.label}>
            <PixelIcon name="back" size={18} />
          </a>
        ) : (
          <PixelLogo size={22} />
        )}
        <PixelText as="h1" size="sm" className={styles.title}>{title}</PixelText>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <main ref={contentRef} className={styles.content}>{children}</main>
      <TabBar active={activeTab} />
    </div>
  )
}
