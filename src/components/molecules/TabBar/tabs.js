import { ROUTES } from '../../../features/navigation/useRoute.js'

export const TABS = [
  { id: 'create', label: 'Crear', icon: 'pot', href: ROUTES.create },
  { id: 'library', label: 'Recetas', icon: 'book', href: ROUTES.library },
  { id: 'account', label: 'Cuenta', icon: 'user', href: ROUTES.account },
]
