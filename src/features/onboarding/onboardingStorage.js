/**
 * Recuerda, por usuario y en este dispositivo, que ya vio el recorrido de bienvenida.
 * La versión (`v1`) permite volver a mostrarlo si más adelante se agregan funciones grandes.
 * Si `localStorage` no se puede usar (modo privado, bloqueado), se recuerda solo mientras la app está abierta.
 */
export const STORAGE_VERSION = 'v1'
export const storageKey = (userId) => `cm.onboarding.${STORAGE_VERSION}.${userId}`

const memory = new Set()

export function hasSeen(userId) {
  if (!userId) return true // sin usuario no se muestra nada
  if (memory.has(userId)) return true
  try {
    return window.localStorage.getItem(storageKey(userId)) === '1'
  } catch {
    return false
  }
}

export function markSeen(userId) {
  if (!userId) return
  memory.add(userId)
  try {
    window.localStorage.setItem(storageKey(userId), '1')
  } catch {
    /* sin almacenamiento: queda solo en memoria */
  }
}

/** Para pruebas: olvida lo recordado en memoria. */
export const resetMemory = () => memory.clear()
