import { useMemo, useSyncExternalStore } from 'react'

/**
 * Rutas por hash: `#/` crear, `#/recetas` biblioteca, `#/recetas/<id>` detalle, `#/recetas/<id>/editar` edición, `#/pinturas` (Mis pinturas, desde el menú lateral) y `#/cuenta`.
 * Con el hash, el botón Atrás del teléfono vuelve entre pantallas y no hace falta configurar el servidor.
 */
export function parseRoute(hash = '') {
  const path = hash.replace(/^#\/?/, '').replace(/\/+$/, '')
  const [first, id, third] = path.split('/')
  if (first === 'recetas') {
    if (id && third === 'editar') return { name: 'recipe-edit', id: decodeURIComponent(id) }
    return id ? { name: 'recipe', id: decodeURIComponent(id) } : { name: 'library' }
  }
  if (first === 'pinturas') return { name: 'paints' }
  if (first === 'cuenta') return { name: 'account' }
  return { name: 'create' }
}

export const ROUTES = {
  create: '#/',
  library: '#/recetas',
  paints: '#/pinturas',
  account: '#/cuenta',
  recipe: (id) => `#/recetas/${encodeURIComponent(id)}`,
  recipeEdit: (id) => `#/recetas/${encodeURIComponent(id)}/editar`,
}

/** Pestaña de la barra inferior que corresponde a una ruta (el detalle y la edición cuentan como Recetas). */
/** `paints` no es pestaña (vive en el menú lateral): no resalta ninguna. */
export const tabFor = (route) => {
  if (route.name === 'recipe' || route.name === 'recipe-edit') return 'library'
  return route.name === 'paints' ? null : route.name
}

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
