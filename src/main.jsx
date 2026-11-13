import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import '@fontsource/press-start-2p'
import './styles/tokens.css'
import './styles/global.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Service worker: la app abre sin conexión y se actualiza sola en el próximo arranque (ver src/pwa/pwaConfig.js).
registerSW({ immediate: true })
