import { useMemo, useSyncExternalStore } from 'react'

/**
 * Rutas por hash: `#/` crear, `#/recetas` biblioteca, `#/recetas/<id>` detalle y `#/cuenta`.
 * Con el hash, el botón Atrás del teléfono vuelve entre pantallas y no hace falta configurar el servidor.
 */
export function parseRoute(hash = '') {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  const [first, id] = path.split('/')
  if (first === 'recetas') {
    return id ? { name: 'recipe', id: decodeURIComponent(id) } : { name: 'library' }
  }
  if (first === 'cuenta') return { name: 'account' }
  return { name: 'create' }
}

export const ROUTES = {
  create: '#/',
  library: '#/recetas',
  account: '#/cuenta',
  recipe: (id) => `#/recetas/${encodeURIComponent(id)}`,
}

/** Pestaña de la barra inferior que corresponde a una ruta (el detalle cuenta como Recetas). */
export const tabFor = (route) => (route.name === 'recipe' ? 'library' : route.name)

/** Cambia de pantalla: acepta `#/recetas`, `/recetas` o una ruta de `ROUTES`. */
export function navigate(to) {
  window.location.hash = to.startsWith('#') ? to : `#${to}`
}

const subscribe = (callback) => {
  window.addEventListener('hashchange', callback)
  return () => window.removeEventListener('hashchange', callback)
}

export function useRoute() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash, () => '')
  const route = useMemo(() => parseRoute(hash), [hash])
  return { route, navigate }
}
