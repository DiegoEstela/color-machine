/** Cómo se instala la app según el teléfono: 'installed' | 'ios' | 'android' | 'other'. Pura, para poder probarla. */
export function detectInstall({ standalone = false, userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (standalone) return 'installed'
  if (/iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)) return 'ios' // iPadOS se presenta como Mac
  if (/Android/i.test(userAgent)) return 'android'
  return 'other'
}

/** Lee el navegador (sin romper si algo no existe). */
export function currentInstall() {
  if (typeof window === 'undefined') return 'other'
  let standalone = false
  try {
    standalone = Boolean(window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone)
  } catch {
    standalone = false
  }
  const nav = window.navigator ?? {}
  return detectInstall({ standalone, userAgent: nav.userAgent ?? '', platform: nav.platform ?? '', maxTouchPoints: nav.maxTouchPoints ?? 0 })
}

export const INSTALL_TEXT = {
  ios: [
    'Tocá el botón Compartir del navegador y elegí "Agregar a inicio".',
    'Así se abre como una app, a pantalla completa y sin la barra del navegador.',
  ],
  android: [
    'Tocá el menú ⋮ del navegador y elegí "Instalar aplicación".',
    'Así se abre como una app, a pantalla completa y sin la barra del navegador.',
  ],
  other: [
    'Buscá "Instalar aplicación" en el menú del navegador, o el ícono de instalar en la barra de direcciones.',
    'Así se abre como una app, a pantalla completa.',
  ],
}
