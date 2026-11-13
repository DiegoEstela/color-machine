import { PixelButton, PixelPanel, PixelText } from '../../components/atoms/index.js'
import { AppShell } from '../../components/templates/index.js'
import { authService, useAuthStore } from '../../features/auth/index.js'
import styles from './Account.module.css'

/** Pestaña "Cuenta": quién está conectado y el cierre de sesión. */
export default function Account() {
  const email = useAuthStore((s) => s.user?.email)
  return (
    <AppShell title="Cuenta" activeTab="account">
      <PixelPanel title="Tu cuenta" padding="md">
        <div className={styles.stack}>
          <PixelText size="xs" tone="soft">Sesión iniciada como</PixelText>
          <PixelText variant="body" className={styles.email}>{email ?? '—'}</PixelText>
          <PixelButton variant="danger" icon="exit" onClick={() => authService.signOut()}>Cerrar sesión</PixelButton>
        </div>
      </PixelPanel>
    </AppShell>
  )
}
