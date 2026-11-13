import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PixelIcon, PixelLogo, PixelText } from '../../atoms/index.js'
import { navigate } from '../../../features/navigation/useRoute.js'
import { tap } from '../../../lib/haptics.js'
import { isOwnBack, markOwnBack } from '../InfoSheet/historyGuard.js'
import styles from './Drawer.module.css'

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
const CLOSE_DRAG_PX = 60 // cuánto hay que arrastrar hacia la izquierda para cerrarlo al soltar

/**
 * Menú lateral (drawer) desde la izquierda. `sections` = `[{ id, title, items: [{ id, label, icon, href, disabled }] }]`.
 * Un ítem con `action` es un botón: se cierra el menú y después se llama a `onAction(item)`.
 * Se cierra con un toque afuera, Esc, el botón Atrás del teléfono o arrastrándolo hacia la izquierda.
 * `role="dialog"`, con el foco atrapado mientras está abierto. Al elegir un ítem se cierra y después se navega,
 * para que el historial quede limpio (una sola entrada, sin un "Atrás" que no hace nada).
 */
export default function Drawer({ open, onClose, sections, activeId, email, onAction }) {
  const panelRef = useRef(null)
  const scrimRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const pendingHref = useRef(null)
  const pendingAction = useRef(null)
  const drag = useRef(null)
  useEffect(() => { onCloseRef.current = onClose })

  // Atrás: al abrir se agrega una entrada al historial; si el usuario vuelve atrás, se cierra el menú.
  useEffect(() => {
    if (!open) return undefined
    const token = Math.random()
    window.history.pushState({ drawer: token }, '')
    let closedByBack = false
    const onPop = () => {
      if (isOwnBack()) return
      closedByBack = true
      onCloseRef.current?.()
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      const href = pendingHref.current
      const action = pendingAction.current
      pendingHref.current = null
      pendingAction.current = null
      // Navegar o abrir algo apenas se cierra pisaría el `history.back()` del menú: se espera a que termine.
      const run = () => { if (href) navigate(href); else action?.() }
      // `history.state` devuelve una copia en los navegadores: se compara el valor, no el objeto.
      if (!closedByBack && window.history.state?.drawer === token) {
        markOwnBack()
        if (href || action) window.addEventListener('popstate', run, { once: true })
        window.history.back()
      } else {
        run()
      }
    }
  }, [open])

  // Esc, foco atrapado y foco devuelto a quien abrió el menú.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.activeElement
    panelRef.current?.querySelector('a[href], button')?.focus()
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

  const choose = (e, item) => {
    e.preventDefault()
    tap()
    if (item.action) pendingAction.current = () => onAction?.(item)
    else pendingHref.current = item.href === window.location.hash ? null : item.href
    onClose?.()
  }

  // Arrastre hacia la izquierda: el panel sigue al dedo y al soltar se cierra o vuelve a su lugar.
  const move = (dx) => {
    if (panelRef.current) panelRef.current.style.transform = dx ? `translateX(${dx}px)` : ''
    if (scrimRef.current) scrimRef.current.style.opacity = dx ? String(Math.max(0, 1 + dx / 300)) : ''
  }
  const dragHandlers = {
    onPointerDown(e) { drag.current = { id: e.pointerId, x: e.clientX, dx: 0 } },
    onPointerMove(e) {
      const d = drag.current
      if (!d || d.id !== e.pointerId) return
      d.dx = Math.min(0, e.clientX - d.x)
      if (d.dx < -8) move(d.dx)
    },
    onPointerUp(e) {
      const d = drag.current
      drag.current = null
      if (!d || d.id !== e.pointerId) return
      if (d.dx <= -CLOSE_DRAG_PX) onClose?.()
      else move(0)
    },
    onPointerCancel() { drag.current = null; move(0) },
  }

  return createPortal(
    <div ref={scrimRef} className={styles.scrim} onClick={() => onClose?.()} data-testid="drawer-scrim">
      <aside
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="Menú"
        onClick={(e) => e.stopPropagation()}
        {...dragHandlers}
      >
        <div className={styles.head}>
          <PixelLogo size={32} />
          <div className={styles.who}>
            <PixelText size="sm">Color Machine</PixelText>
            {email && <PixelText size="xs" tone="soft" className={styles.email}>{email}</PixelText>}
          </div>
        </div>

        <nav className={styles.nav} aria-label="Menú">
          {sections.map((section) => (
            <section key={section.id} className={styles.section}>
              {section.title && <PixelText as="h2" size="xs" tone="soft" className={styles.sectionTitle}>{section.title}</PixelText>}
              <ul className={styles.list}>
                {section.items.map((item) => (
                  <li key={item.id}>
                    {item.action && !item.disabled ? (
                      <button type="button" className={styles.item} onClick={(e) => choose(e, item)}>
                        <PixelIcon name={item.icon} size={18} />
                        <span className={styles.label}>{item.label}</span>
                      </button>
                    ) : item.disabled || !item.href ? (
                      <span className={styles.item} aria-disabled="true" data-disabled>
                        <PixelIcon name={item.icon} size={18} />
                        <span className={styles.label}>{item.label}</span>
                      </span>
                    ) : (
                      <a
                        href={item.href}
                        className={styles.item}
                        aria-current={activeId === item.id ? 'page' : undefined}
                        onClick={(e) => choose(e, item)}
                      >
                        <PixelIcon name={item.icon} size={18} />
                        <span className={styles.label}>{item.label}</span>
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
      </aside>
    </div>,
    document.body,
  )
}
