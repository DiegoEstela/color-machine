/** Vibración corta al tocar controles de navegación. Si el dispositivo no la soporta (iOS), no hace nada. */
export function tap(ms = 8) {
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') navigator.vibrate(ms)
  } catch {
    /* sin vibración: no es importante */
  }
}
