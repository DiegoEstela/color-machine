import { useEffect } from 'react'
import { PixelButton, PixelPanel, PixelText } from './components/atoms/index.js'
import { authService, useAuthStore } from './features/auth/index.js'
import Auth from './pages/Auth/Auth.jsx'
import Catalog from './pages/Catalog/Catalog.jsx'
import Create from './pages/Create/Create.jsx'
import styles from './App.module.css'

// El catálogo de átomos queda accesible en /?catalog=1
const showCatalog = new URLSearchParams(window.location.search).has('catalog')

export default function App() {
  const status = useAuthStore((s) => s.status)
  const recovering = useAuthStore((s) => s.recovering)
  const init = useAuthStore((s) => s.init)

  useEffect(() => init(), [init])

  if (status === 'loading') {
    return <main className={styles.center}><PixelText>Cargando...</PixelText></main>
  }
  if (status === 'unconfigured') {
    return (
      <main className={styles.center}>
        <PixelPanel tone="yellow">
          <PixelText variant="body">Falta configurar Supabase: completá VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.</PixelText>
        </PixelPanel>
      </main>
    )
  }
  if (status === 'signedOut' || recovering) return <Auth />

  return (
    <>
      <header className={styles.header}>
        <PixelText size="sm">Color Machine</PixelText>
        <PixelButton variant="secondary" size="sm" onClick={() => authService.signOut()}>Salir</PixelButton>
      </header>
      {showCatalog ? <Catalog /> : <Create />}
    </>
  )
}
