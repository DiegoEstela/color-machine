import { useCallback, useState } from 'react'
import { PixelText } from '../../atoms/index.js'
import { PaintForm, PhotoCropper, PhotoPicker } from '../../molecules/index.js'
import { ColorSwatch } from '../../atoms/index.js'
import styles from './PaintCapture.module.css'

/**
 * Alta de una pintura: foto (opcional) → recorte → nombre → guardar.
 * `onSubmit({ name, hex }, thumbnail)` devuelve `{ error? }`; si no hay error se llama a `onDone`.
 */
export default function PaintCapture({ onSubmit, onCancel, onDone, initialName = '' }) {
  const [file, setFile] = useState(null)
  const [hex, setHex] = useState(null)
  const [thumb, setThumb] = useState(null)
  const [photoError, setPhotoError] = useState(null)

  const handleFile = (f) => { setPhotoError(null); setFile(f) }
  const handlePhotoError = useCallback((msg) => { setPhotoError(msg); setFile(null) }, [])
  const handleCrop = useCallback(({ hex: h, thumbnail }) => { setHex(h); setThumb(thumbnail) }, [])
  const handleHex = (h) => { setHex(h); setThumb(null) } // el color ya no coincide con el recorte

  async function handleSubmit(values) {
    const result = await onSubmit(values, thumb)
    if (!result?.error) onDone?.()
    return result
  }

  return (
    <div className={styles.root}>
      <PixelText as="h2" size="sm">Nueva pintura</PixelText>
      <PixelText variant="body" tone="soft">
        Sacale una foto al frasco y encuadrá la zona de pintura; pellizcá la foto para acercar. También podés escribir el color a mano. Mejor con luz natural.
      </PixelText>
      <PhotoPicker onFile={handleFile} />
      {photoError && <PixelText variant="body" tone="danger" role="alert">{photoError}</PixelText>}
      <PhotoCropper file={file} onChange={handleCrop} onError={handlePhotoError} />
      {hex && (
        <div className={styles.preview}>
          {thumb && <img src={thumb} alt="Recorte de la foto" className={styles.thumb} />}
          <ColorSwatch color={hex} size="lg" label="Color de la pintura" />
        </div>
      )}
      <PaintForm initialName={initialName} hex={hex} onHexChange={handleHex} onSubmit={handleSubmit} onCancel={onCancel} submitLabel="Guardar pintura" />
    </div>
  )
}
