/**
 * Configuración de la PWA (manifest y service worker). La usa `vite.config.js` y la verifican los tests.
 * Los íconos salen de `npm run icons` (scripts/generate-icons.mjs).
 */
export const THEME_COLOR = '#cdb4db' // lavanda de la barra superior y de la barra de estado
export const BACKGROUND_COLOR = '#cdb4db' // fondo de la pantalla de arranque, igual al de los íconos

export const manifest = {
  id: '/',
  name: 'Color Machine',
  short_name: 'Color Machine',
  description: 'Creá la mezcla justa de pinturas para cualquier color.',
  lang: 'es',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  display_override: ['standalone', 'minimal-ui'],
  orientation: 'portrait',
  theme_color: THEME_COLOR,
  background_color: BACKGROUND_COLOR,
  icons: [
    { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}

/**
 * Todo lo que no es de nuestro propio origen (Supabase: datos y sesión) va siempre a la red:
 * nunca se guarda en el caché. Va como función autocontenida porque se copia tal cual al service worker.
 */
export const isNetworkOnly = ({ sameOrigin }) => !sameOrigin

export const workbox = {
  globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2,webmanifest}'],
  navigateFallback: '/index.html',
  cleanupOutdatedCaches: true,
  runtimeCaching: [{ urlPattern: isNetworkOnly, handler: 'NetworkOnly' }],
}

export const pwaOptions = {
  // "prompt" sin pedir confirmación: la versión nueva se instala en segundo plano y se activa
  // la próxima vez que se abre la app, así nunca se recarga en medio de una mezcla.
  registerType: 'prompt',
  injectRegister: false, // se registra a mano en src/main.jsx
  manifest,
  workbox,
  devOptions: { enabled: false },
}
