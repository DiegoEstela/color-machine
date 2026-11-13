import { useEffect, useMemo, useRef } from 'react'
import { PixelIcon, PixelIconButton, PixelText } from '../../atoms/index.js'
import { Drawer, HelpButton, TabBar } from '../../molecules/index.js'
import OnboardingSheet from '../../organisms/OnboardingSheet/OnboardingSheet.jsx'
import { useAuthStore } from '../../../features/auth/index.js'
import { MENU_SECTIONS, menuItemFor } from '../../../features/navigation/menuItems.js'
import { useMixStore } from '../../../features/color-mixer/mixStore.js'
import { currentInstall } from '../../../features/onboarding/installHint.js'
import { useOnboardingStore } from '../../../features/onboarding/onboardingStore.js'
import { CONTEXT, helpScreenFor } from '../../../features/onboarding/steps.js'
import { buildTour, contextCard } from '../../../features/onboarding/tour.js'
import { useNavigationStore } from '../../../features/navigation/navigationStore.js'
import { useRoute } from '../../../features/navigation/useRoute.js'
import { useCanScrollMore } from '../../../hooks/useCanScrollMore.js'
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
 * El botón ? (abajo a la derecha) abre la ayuda de la pantalla actual; el recorrido de bienvenida se muestra desde acá.
 */
export default function AppShell({ title, actions, back, activeTab, scrollKey, children }) {
  const contentRef = useRef(null)
  useEffect(() => { contentRef.current?.scrollTo?.(0, 0) }, [scrollKey])

  const canScrollMore = useCanScrollMore(contentRef, scrollKey)
  const { route } = useRoute()
  const email = useAuthStore((s) => s.user?.email)
  const drawerOpen = useNavigationStore((s) => s.drawerOpen)
  const { openDrawer, closeDrawer } = useNavigationStore.getState()
  const step = useMixStore((s) => s.step)
  const onboarding = useOnboardingStore()
  const helpScreen = helpScreenFor(route, step)
  const cards = useMemo(
    () => (onboarding.mode === 'tour' ? buildTour(currentInstall()) : [contextCard(onboarding.screen && CONTEXT[onboarding.screen] ? onboarding.screen : helpScreen)]),
    [onboarding.mode, onboarding.screen, helpScreen],
  )
  useEdgeSwipe(() => { tap(); openDrawer() }, !drawerOpen && !onboarding.open)

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
      <div className={styles.body}>
        <main ref={contentRef} className={styles.content}>{children}</main>
        {/* Degradé suave: avisa que hay más contenido abajo. No intercepta toques. */}
        <div className={styles.fade} data-visible={canScrollMore || undefined} aria-hidden="true" data-testid="scroll-fade" />
      </div>
      <TabBar active={activeTab} />
      <HelpButton onClick={() => { tap(); onboarding.startContext(helpScreen) }} />
      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        sections={MENU_SECTIONS}
        activeId={menuItemFor(route)}
        email={email}
        onAction={(item) => { if (item.action === 'help') useOnboardingStore.getState().startContext(helpScreen) }}
      />
      <OnboardingSheet
        open={onboarding.open}
        mode={onboarding.mode}
        cards={cards}
        index={onboarding.index}
        onIndex={(i) => onboarding.goTo(i, cards.length)}
        onClose={onboarding.close}
        onShowTour={onboarding.showTour}
      />
    </div>
  )
}
