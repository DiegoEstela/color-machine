import { INSTALL_TEXT } from './installHint.js'
import { CONTEXT, TOUR } from './steps.js'

/**
 * Tarjetas del recorrido: la de "Instalala" lleva el texto de ese teléfono y se omite si la app ya está instalada.
 * `install` = resultado de `detectInstall`.
 */
export function buildTour(install) {
  return TOUR
    .filter((card) => !(card.id === 'install' && install === 'installed'))
    .map((card) => (card.id === 'install' ? { ...card, body: INSTALL_TEXT[install] ?? INSTALL_TEXT.other } : card))
}

/** Tarjeta de ayuda de una pantalla (o la de Crear paso 1 si no se reconoce). */
export const contextCard = (screen) => ({ id: screen, ...(CONTEXT[screen] ?? CONTEXT['create-1']) })
