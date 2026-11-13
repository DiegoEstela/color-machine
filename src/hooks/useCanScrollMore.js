import { useCallback, useEffect, useState } from 'react'

/** ¿Queda contenido por debajo de lo que se ve? Pura, para poder probarla (con 2 px de tolerancia por redondeos). */
export function hasMoreBelow({ scrollTop, clientHeight, scrollHeight }) {
  return scrollHeight - clientHeight - scrollTop > 2
}

/**
 * Dice si el elemento (`ref`) todavía se puede desplazar hacia abajo. Se actualiza al hacer scroll, al cambiar su
 * tamaño o su contenido, y cuando cambia `watchKey` (por ejemplo, el paso). Sirve para mostrar el degradé "hay más".
 */
export function useCanScrollMore(ref, watchKey) {
  const [more, setMore] = useState(false)
  const update = useCallback(() => {
    const el = ref.current
    if (el) setMore(hasMoreBelow(el))
  }, [ref])

  useEffect(() => {
    const el = ref.current
    if (!el) return undefined
    update()
    el.addEventListener('scroll', update, { passive: true })
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)
    resize?.observe(el)
    const mutations = typeof MutationObserver === 'undefined' ? null : new MutationObserver(update)
    mutations?.observe(el, { childList: true, subtree: true, characterData: true })
    return () => {
      el.removeEventListener('scroll', update)
      resize?.disconnect()
      mutations?.disconnect()
    }
  }, [ref, update, watchKey])

  return more
}
