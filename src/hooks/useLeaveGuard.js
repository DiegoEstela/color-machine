import { useCallback, useEffect, useRef, useState } from 'react'
import { isOwnBack, markOwnBack } from '../components/molecules/InfoSheet/historyGuard.js'
import { navigate } from '../features/navigation/useRoute.js'

/**
 * Avisa antes de salir de una pantalla con cambios sin guardar. Mientras `active`:
 * - toca los enlaces internos (`#/...`) y el botón Atrás del teléfono: no sale, pone `pending` para que la pantalla
 *   pregunte "¿Descartar los cambios?";
 * - el navegador pregunta si se cierra o recarga la pestaña.
 * `stay()` cierra la pregunta; `leave()` sale a donde se quería ir. `leaveTo(href)` sale sin preguntar (por ejemplo, tras guardar).
 */
export function useLeaveGuard(active) {
  const [pending, setPending] = useState(null) // { type: 'link', href } | { type: 'back' }
  const leaving = useRef(false)
  const pendingRef = useRef(null)
  useEffect(() => { pendingRef.current = pending })

  useEffect(() => {
    if (!active) return undefined
    leaving.current = false
    // Una entrada de historial propia: "Atrás" cae acá, en la misma pantalla, y se puede preguntar.
    window.history.pushState({ leaveGuard: true }, '')
    const onPop = () => {
      if (isOwnBack() || leaving.current) return
      setPending({ type: 'back' })
    }
    const onClick = (e) => {
      const link = e.target.closest?.('a[href^="#"]')
      if (!link || leaving.current) return
      const href = link.getAttribute('href')
      if (href === window.location.hash) return
      e.preventDefault()
      e.stopPropagation() // que no siga a otros manejadores (por ejemplo, el menú lateral)
      setPending({ type: 'link', href })
    }
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('popstate', onPop)
    document.addEventListener('click', onClick, true)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('popstate', onPop)
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('beforeunload', onBeforeUnload)
      // `history.state` devuelve una copia en los navegadores: se compara el valor, no el objeto.
      if (!leaving.current && window.history.state?.leaveGuard) { markOwnBack(); window.history.back() }
    }
  }, [active])

  const stay = useCallback(() => {
    // Si se había apretado Atrás, la entrada propia ya se consumió: se vuelve a poner.
    if (pendingRef.current?.type === 'back') window.history.pushState({ leaveGuard: true }, '')
    setPending(null)
  }, [])

  const leaveTo = useCallback((href) => {
    leaving.current = true
    setPending(null)
    markOwnBack()
    if (window.history.state?.leaveGuard) {
      // Se deshace la entrada propia y recién después se navega, para no dejar entradas de más.
      if (href) window.addEventListener('popstate', () => navigate(href), { once: true })
      window.history.back()
    } else if (href) {
      navigate(href)
    }
  }, [])

  const leave = useCallback(() => {
    const p = pendingRef.current
    if (p?.type === 'link') return leaveTo(p.href)
    // Atrás: la entrada propia ya se consumió; falta volver una más.
    leaving.current = true
    setPending(null)
    markOwnBack()
    window.history.back()
    return undefined
  }, [leaveTo])

  return { pending, stay, leave, leaveTo }
}
