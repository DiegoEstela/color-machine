import { ROUTES } from '../../../features/navigation/useRoute.js'

/** Orden de la barra: Crear va en el centro y se muestra elevado (`primary`). */
export const TABS = [
  { id: 'library', label: 'Recetas', icon: 'book', href: ROUTES.library },
  { id: 'create', label: 'Crear', icon: 'pot', href: ROUTES.create, primary: true },
  { id: 'account', label: 'Cuenta', icon: 'user', href: ROUTES.account },
]
