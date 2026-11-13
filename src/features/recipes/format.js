/** Fecha corta en español: "14 nov 2026". Devuelve '' si la fecha no es válida. */
export function formatRecipeDate(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' }).format(date).replace(/\./g, '')
}
