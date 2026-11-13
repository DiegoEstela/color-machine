import { useEffect } from 'react'
import { PixelPanel, PixelText } from './components/atoms/index.js'
import { useAuthStore } from './features/auth/index.js'
import { useRoute } from './features/navigation/useRoute.js'
import Account from './pages/Account/Account.jsx'
import Auth from './pages/Auth/Auth.jsx'
import Catalog from './pages/Catalog/Catalog.jsx'
import Create from './pages/Create/Create.jsx'
import Library from './pages/Library/Library.jsx'
import RecipePage from './pages/RecipePage/RecipePage.jsx'
import styles from './App.module.css'

// El catálogo de átomos queda accesible en /?catalog=1
const showCatalog = new URLSearchParams(window.location.search).has('catalog')

export default function App() {
  const status = useAuthStore((s) => s.status)
  const recovering = useAuthStore((s) => s.recovering)
  const init = useAuthStore((s) => s.init)
  const { route } = useRoute()

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
  if (status === 'signedOut' || recovering) return <Auth /> // la pantalla de acceso no lleva barra de pestañas
  if (showCatalog) return <Catalog />

  switch (route.name) {
    case 'library': return <Library />
    case 'recipe': return <RecipePage id={route.id} />
    case 'account': return <Account />
    default: return <Create />
  }
}
