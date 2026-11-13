import { ROUTES } from './useRoute.js'

/**
 * Contenido del menú lateral, definido por datos: para sumar una sección o un ítem se agrega acá.
 * Un ítem con `href` es un enlace; con `action` es un botón que hace algo (por ejemplo, abrir la ayuda);
 * con `disabled` (o sin ninguno de los dos) se muestra como "próximamente".
 */
export const MENU_SECTIONS = [
  {
    id: 'main',
    title: null,
    items: [
      { id: 'paints', label: 'Mis pinturas', icon: 'jar', href: ROUTES.paints },
      { id: 'library', label: 'Recetas', icon: 'book', href: ROUTES.library },
      { id: 'account', label: 'Cuenta', icon: 'user', href: ROUTES.account },
      { id: 'help', label: 'Ayuda', icon: 'help', action: 'help' },
    ],
  },
  {
    id: 'soon',
    title: 'Próximamente',
    items: [
      { id: 'quantities', label: 'Calculador de cantidades', icon: 'drop', disabled: true },
      { id: 'share', label: 'Compartir recetas', icon: 'save', disabled: true },
    ],
  },
]

/** Ítem del menú que corresponde a una ruta (el detalle de una receta cuenta como Recetas). */
export function menuItemFor(route) {
  if (route.name === 'paints') return 'paints'
  if (route.name === 'library' || route.name === 'recipe' || route.name === 'recipe-edit') return 'library'
  if (route.name === 'account') return 'account'
  return null
}
