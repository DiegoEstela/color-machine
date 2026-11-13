import { useEffect, useRef, useState } from 'react'
import { loadImageToCanvas } from '../lib/image.js'

export const imageErrorMessage = (err) =>
  err?.code === 'not_image' ? 'El archivo no es una imagen.' : 'No pudimos abrir la foto. Probá con otra.'

/**
 * Carga `file` (reducido) en el canvas de `canvasRef`. `ready` es true cuando el canvas ya muestra ese archivo.
 * `onError` debe ser estable (useCallback) para no recargar la foto.
 */
export function useImageCanvas(file, onError) {
  const canvasRef = useRef(null)
  const [loadedFile, setLoadedFile] = useState(null)

  useEffect(() => {
    let cancelled = false
    if (!file) return undefined
    loadImageToCanvas(file)
      .then((source) => {
        const canvas = canvasRef.current
        if (cancelled || !canvas) return
        canvas.width = source.width
        canvas.height = source.height
        canvas.getContext('2d')?.drawImage(source, 0, 0)
        setLoadedFile(file)
      })
      .catch((err) => { if (!cancelled) onError?.(imageErrorMessage(err)) })
    return () => { cancelled = true }
  }, [file, onError])

  return { canvasRef, ready: Boolean(file) && loadedFile === file }
}
