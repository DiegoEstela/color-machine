import { useCallback, useState } from 'react'
import { PixelButton, PixelInput, PixelText } from '../../atoms/index.js'
import { ColorPreview, ColorWheel, PhotoColorPicker, PhotoCropper, PhotoPicker } from '../../molecules/index.js'
import { normalizeHex } from '../../../lib/color.js'
import styles from './TargetColorPicker.module.css'

const TABS = [
  { id: 'wheel', label: 'Rueda' },
  { id: 'photo', label: 'Foto' },
]
const PHOTO_MODES = [
  { id: 'crop', label: 'Recorte' },
  { id: 'point', label: 'Punto' },
]

/**
 * Paso 1: elegir el color objetivo con la rueda o desde una foto (recorte o punto).
 * `value` es un hex o null; `thumbnail` es la miniatura del recorte (solo en memoria) o null.
 * Todo está pensado para entrar en una pantalla de celular sin scroll.
 */
export default function TargetColorPicker({ value, thumbnail = null, onChange, onThumbnail, onNext }) {
  const [tab, setTab] = useState('wheel')
  const [photoMode, setPhotoMode] = useState('crop')
  const [file, setFile] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const [draft, setDraft] = useState(null) // texto del campo hex mientras se edita

  const handleFile = (f) => { setPhotoError(null); setFile(f) }
  const handlePhotoError = useCallback((msg) => { setPhotoError(msg); setFile(null) }, [])

  // Cualquier color que no venga del recorte deja sin efecto la miniatura anterior.
  const pickManual = (hex) => { onChange(hex); onThumbnail?.(null) }
  const handleCrop = ({ hex, thumbnail: thumb }) => { onChange(hex); onThumbnail?.(thumb) }

  const handleHex = (e) => {
    const text = e.target.value
    setDraft(text)
    const hex = normalizeHex(text)
    if (hex) pickManual(hex)
  }

  const shownHex = draft ?? value ?? ''
  const hexError = draft && !normalizeHex(draft) ? 'Usá un hex válido, por ejemplo #e63946.' : undefined

  // Vista del color + campo hex: al costado de la rueda, o en una fila debajo de la foto.
  const result = (
    <div className={styles.result}>
      <ColorPreview color={value} thumbnail={thumbnail} />
      <PixelInput
        label="Color (hex)"
        value={shownHex}
        onChange={handleHex}
        onBlur={() => setDraft(null)}
        error={hexError}
        placeholder="#e63946"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
    </div>
  )

  return (
    <div className={styles.root}>
      <div className={styles.tabs} role="group" aria-label="Cómo elegir el color">
        {TABS.map(({ id, label }) => (
          <PixelButton
            key={id}
            variant={tab === id ? 'primary' : 'secondary'}
            aria-pressed={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </PixelButton>
        ))}
      </div>

      {tab === 'wheel' && <ColorWheel value={value} onChange={pickManual} aside={result} />}

      {tab === 'photo' && (
        <div className={styles.photo}>
          <PhotoPicker onFile={handleFile} />
          <div className={styles.tabs} role="group" aria-label="Cómo tomar el color de la foto">
            {PHOTO_MODES.map(({ id, label }) => (
              <PixelButton
                key={id}
                size="sm"
                variant={photoMode === id ? 'primary' : 'secondary'}
                aria-pressed={photoMode === id}
                onClick={() => setPhotoMode(id)}
              >
                {label}
              </PixelButton>
            ))}
          </div>
          <PixelText variant="body" size="sm" tone="soft">
            {photoMode === 'crop' ? 'Encuadrá la zona del color.' : 'Tocá un punto de la foto.'} Mejor con luz natural.
          </PixelText>
          {photoError && <PixelText variant="body" size="sm" tone="danger" role="alert">{photoError}</PixelText>}
          {photoMode === 'crop'
            ? <PhotoCropper file={file} onChange={handleCrop} onError={handlePhotoError} />
            : <PhotoColorPicker file={file} onPick={pickManual} onError={handlePhotoError} />}
          <div className={styles.resultRow}>{result}</div>
        </div>
      )}

      <PixelButton size="lg" disabled={!value} onClick={onNext}>Siguiente</PixelButton>
    </div>
  )
}
