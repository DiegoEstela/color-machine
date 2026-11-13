import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PixelButton, PixelText } from '../../atoms/index.js'
import { isOwnBack, markOwnBack } from './historyGuard.js'
import styles from './InfoSheet.module.css'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Hoja informativa inferior (bottom sheet) con fondo atenuado. Se cierra con un toque afuera, el botón,
 * la tecla Esc o el botón Atrás del teléfono. `role="dialog"`, con el foco atrapado mientras está abierta.
 */
export default function InfoSheet({ open, onClose, title, children, closeLabel = 'Entendido' }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  // Atrás: al abrir se agrega una entrada al historial; si el usuario vuelve atrás, se cierra la hoja.
  useEffect(() => {
    if (!open) return undefined
    const token = Math.random()
    window.history.pushState({ infoSheet: token }, '')
    let closedByBack = false
    const onPop = () => {
      if (isOwnBack()) return
      closedByBack = true
      onCloseRef.current?.()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // `history.state` devuelve una copia en los navegadores: se compara el valor, no el objeto.
      if (!closedByBack && window.history.state?.infoSheet === token) { markOwnBack(); window.history.back() }
    }
  }, [open])

  // Esc, foco atrapado y foco devuelto a quien abrió la hoja.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    panelRef.current?.querySelector('button')?.focus()
    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current?.(); return }
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = [...panelRef.current.querySelectorAll(FOCUSABLE)]
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus?.()
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className={styles.scrim} onClick={() => onClose?.()} data-testid="sheet-scrim">
      <div
        ref={panelRef}
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <PixelText as="h2" size="sm">{title}</PixelText>
        <div className={styles.body}>{children}</div>
        <PixelButton onClick={() => onClose?.()}>{closeLabel}</PixelButton>
      </div>
    </div>,
    document.body,
  )
}
