import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PixelButton, PixelText } from '../../atoms/index.js'
import { OnboardingArt } from '../../molecules/index.js'
import { isOwnBack, markOwnBack } from '../../molecules/InfoSheet/historyGuard.js'
import { swipeDirection } from '../../../lib/swipe.js'
import styles from './OnboardingSheet.module.css'

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Recorrido de bienvenida (`mode="tour"`) o ayuda de una pantalla (`mode="context"`), a pantalla completa.
 * - `cards`: `[{ id, title, body: [..], art }]`. En `context` es una sola; en `tour`, todas, y `index` es la actual.
 * - `onIndex(i)` cambia de tarjeta (botones, flechas del teclado y deslizar). `onClose()` cierra (Omitir, Esc, Atrás).
 * - `onShowTour()` (solo en `context`): pasar al recorrido completo.
 * `role="dialog"`, con el foco atrapado; el botón Atrás del teléfono lo cierra.
 */
export default function OnboardingSheet({ open, mode, cards, index, onIndex, onClose, onShowTour }) {
  const panelRef = useRef(null)
  const touch = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })
  const total = cards.length
  const tour = mode === 'tour'
  const last = index >= total - 1

  // Atrás: al abrir se agrega una entrada al historial; si el usuario vuelve atrás, se cierra.
  useEffect(() => {
    if (!open) return undefined
    const token = Math.random()
    window.history.pushState({ onboarding: token }, '')
    let closedByBack = false
    const onPop = () => {
      if (isOwnBack()) return
      closedByBack = true
      onCloseRef.current?.()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      if (!closedByBack && window.history.state?.onboarding === token) { markOwnBack(); window.history.back() }
    }
  }, [open])

  // Foco atrapado, Esc y flechas; el foco vuelve a quien abrió el recorrido.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    panelRef.current?.querySelector('[data-primary]')?.focus()
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current?.(); return }
      if (tour && e.key === 'ArrowRight') { e.preventDefault(); onIndex(index + 1) }
      if (tour && e.key === 'ArrowLeft') { e.preventDefault(); onIndex(index - 1) }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const lastItem = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastItem.focus() }
      else if (!e.shiftKey && document.activeElement === lastItem) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [open, tour, index, onIndex])

  if (!open || total === 0) return null
  const card = cards[Math.min(index, total - 1)]

  // Deslizar de lado cambia de tarjeta (con un umbral, sin seguir al dedo).
  const onTouchStart = (e) => {
    const t = e.touches[0]
    touch.current = e.touches.length === 1 ? { x: t.clientX, y: t.clientY } : null
  }
  const onTouchEnd = (e) => {
    const s = touch.current
    touch.current = null
    const t = e.changedTouches[0]
    if (!tour || !s || !t) return
    const dir = swipeDirection(t.clientX - s.x, t.clientY - s.y)
    if (dir === 'left') onIndex(index + 1) // arrastrar hacia la izquierda = siguiente
    if (dir === 'right') onIndex(index - 1)
  }

  return createPortal(
    <div className={styles.overlay}>
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label={tour ? 'Recorrido de bienvenida' : `Ayuda: ${card.title}`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className={styles.top}>
          {tour
            ? <PixelText as="span" size="xs" tone="soft" role="status">Paso {index + 1} de {total}</PixelText>
            : <PixelText as="span" size="xs" tone="soft">Ayuda</PixelText>}
          <PixelButton size="sm" variant="secondary" onClick={() => onClose()}>{tour ? 'Omitir' : 'Cerrar'}</PixelButton>
        </div>

        <div className={styles.card} aria-live="polite">
          <OnboardingArt scene={card.art} />
          <PixelText as="h2" size="md" className={styles.title}>{card.title}</PixelText>
          <div className={styles.body}>
            {card.body.map((line) => <PixelText key={line} variant="body">{line}</PixelText>)}
          </div>
        </div>

        {tour && (
          <div className={styles.dots} aria-hidden="true">
            {cards.map((c, i) => <span key={c.id} className={styles.dot} data-on={i === index || undefined} />)}
          </div>
        )}

        <div className={styles.actions}>
          {tour ? (
            <>
              <PixelButton variant="secondary" disabled={index === 0} onClick={() => onIndex(index - 1)}>Atrás</PixelButton>
              <PixelButton data-primary size="lg" onClick={() => (last ? onClose() : onIndex(index + 1))}>
                {last ? '¡Empezar!' : 'Siguiente'}
              </PixelButton>
            </>
          ) : (
            <>
              <PixelButton variant="secondary" onClick={() => onShowTour()}>Ver el recorrido completo</PixelButton>
              <PixelButton data-primary size="lg" onClick={() => onClose()}>Entendido</PixelButton>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
