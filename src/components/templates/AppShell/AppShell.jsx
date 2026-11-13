import { useEffect, useRef } from 'react'
import { PixelIcon, PixelIconButton, PixelText } from '../../atoms/index.js'
import { Drawer, TabBar } from '../../molecules/index.js'
import { useAuthStore } from '../../../features/auth/index.js'
import { MENU_SECTIONS, menuItemFor } from '../../../features/navigation/menuItems.js'
import { useNavigationStore } from '../../../features/navigation/navigationStore.js'
import { useRoute } from '../../../features/navigation/useRoute.js'
import { useEdgeSwipe } from '../../../hooks/useEdgeSwipe.js'
import { tap } from '../../../lib/haptics.js'
import styles from './AppShell.module.css'

/**
 * Estructura de app a pantalla completa: barra superior (48 px) con el botón ☰ del menú lateral, contenido con su propio
 * scroll y barra de pestañas inferior (56 px). Los dos extremos tienen siempre el mismo alto, más la zona segura del teléfono.
 * - `title`: título de la pantalla. `actions`: lo que va a la derecha de la barra (por ejemplo, los pasos).
 * - `back`: `{ href, label }` muestra una flecha para volver en lugar del botón ☰.
 * - `activeTab`: pestaña resaltada. `scrollKey`: al cambiar, el contenido vuelve arriba (por ejemplo, el paso).
 * El menú lateral se abre con ☰ o deslizando desde el borde izquierdo.
 */
export default function AppShell({ title, actions, back, activeTab, scrollKey, children }) {
  const contentRef = useRef(null)
  useEffect(() => { contentRef.current?.scrollTo?.(0, 0) }, [scrollKey])

  const { route } = useRoute()
  const email = useAuthStore((s) => s.user?.email)
  const drawerOpen = useNavigationStore((s) => s.drawerOpen)
  const { openDrawer, closeDrawer } = useNavigationStore.getState()
  useEdgeSwipe(() => { tap(); openDrawer() }, !drawerOpen)

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        {back ? (
          <a href={back.href} className={styles.back} aria-label={back.label}>
            <PixelIcon name="back" size={18} />
          </a>
        ) : (
          <PixelIconButton
            icon="menu"
            label="Abrir menú"
            variant="primary"
            aria-haspopup="dialog"
            aria-expanded={drawerOpen}
            onClick={() => { tap(); openDrawer() }}
          />
        )}
        <PixelText as="h1" size="sm" className={styles.title}>{title}</PixelText>
        {actions && <div className={styles.actions}>{actions}</div>}
      </header>
      <main ref={contentRef} className={styles.content}>{children}</main>
      <TabBar active={activeTab} />
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        sections={MENU_SECTIONS}
        activeId={menuItemFor(route)}
        email={email}
      />
    </div>
  )
}
