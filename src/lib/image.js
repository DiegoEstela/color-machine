/** Escala (w, h) para que el lado mayor no pase de `max`, sin agrandar. */
export function fitSize(width, height, max) {
  const scale = Math.min(1, max / Math.max(width, height))
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) }
}

/**
 * Carga un archivo de imagen en un canvas reducido (lado mayor <= maxSize).
 * `createImageBitmap` respeta la orientación EXIF. Lanza Error con `code` 'not_image' o 'decode_failed'.
 */
export async function loadImageToCanvas(file, maxSize = 1024) {
  if (!file || !file.type?.startsWith('image/')) {
    throw Object.assign(new Error('El archivo no es una imagen.'), { code: 'not_image' })
  }
  let bitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw Object.assign(new Error('No se pudo leer la imagen.'), { code: 'decode_failed' })
  }
  const { width, height } = fitSize(bitmap.width, bitmap.height, maxSize)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height)
  bitmap.close?.()
  return canvas
}
