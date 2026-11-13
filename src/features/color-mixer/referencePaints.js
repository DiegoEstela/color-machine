/**
 * Pinturas base de una caja de témperas, con colores típicos de pigmento.
 * Son el punto de partida del consejero; ajustar aquí si los consejos no se parecen a la realidad.
 * `standard: true` marca que es un color típico de caja de témperas y no una pintura del usuario
 * (así se etiqueta cuando se suma a una mezcla desde el paso 3).
 */
export const BASE_PAINTS = [
  { id: 'base-rojo', standard: true, name: 'Rojo', hex: '#e4002b' },
  { id: 'base-amarillo', standard: true, name: 'Amarillo', hex: '#fcd116' },
  { id: 'base-azul', standard: true, name: 'Azul', hex: '#1d3fbb' },
  { id: 'base-blanco', standard: true, name: 'Blanco', hex: '#ffffff' },
  { id: 'base-negro', standard: true, name: 'Negro', hex: '#141414' },
]
