// Cuando la hoja se cierra por su cuenta (botón, Esc, toque afuera) deshace con `history.back()` la entrada que
// había agregado. Ese `popstate` es propio y no debe contarse como "el usuario volvió atrás".
// Se ignora durante una ventana corta en lugar de contar eventos, así un `back()` que no llega a hacer nada
// no deja el contador desfasado.
const OWN_BACK_WINDOW_MS = 400
let ignoreUntil = 0

export const markOwnBack = () => { ignoreUntil = performance.now() + OWN_BACK_WINDOW_MS }
export const isOwnBack = () => performance.now() < ignoreUntil
export const resetOwnBack = () => { ignoreUntil = 0 }
