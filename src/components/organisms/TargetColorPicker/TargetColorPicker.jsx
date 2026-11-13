import { useCallback, useState } from 'react'
import { ColorSwatch, PixelButton, PixelInput, PixelText } from '../../atoms/index.js'
import { ColorWheel, PhotoColorPicker, PhotoPicker } from '../../molecules/index.js'
import { normalizeHex } from '../../../lib/color.js'
import styles from './TargetColorPicker.module.css'

const TABS = [
  { id: 'wheel', label: 'Rueda' },
  { id: 'photo', label: 'Foto' },
]

/** Paso 1: elegir el color objetivo con la rueda o desde una foto. `value` es un hex o null. */
export default function TargetColorPicker({ value, onChange, onNext }) {
  const [tab, setTab] = useState('wheel')
  const [file, setFile] = useState(null)
  const [photoError, setPhotoError] = useState(null)
  const [draft, setDraft] = useState(null) // texto del campo hex mientras se edita

  const handleFile = (f) => { setPhotoError(null); setFile(f) }
  const handlePhotoError = useCallback((msg) => { setPhotoError(msg); setFile(null) }, [])

  const handleHex = (e) => {
    const text = e.target.value
    setDraft(text)
    const hex = normalizeHex(text)
    if (hex) onChange(hex)
  }

  const shownHex = draft ?? value ?? ''
  const hexError = draft && !normalizeHex(draft) ? 'Usá un hex válido, por ejemplo #e63946.' : undefined

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

      {tab === 'wheel' && <ColorWheel value={value} onChange={onChange} />}

      {tab === 'photo' && (
        <div className={styles.photo}>
          <PhotoPicker onFile={handleFile} />
          <PixelText variant="body" tone="soft">
            Tocá un punto de la foto para tomar su color. Funciona mejor con luz natural y sin filtros.
          </PixelText>
          {photoError && <PixelText variant="body" tone="danger" role="alert">{photoError}</PixelText>}
          <PhotoColorPicker file={file} onPick={onChange} onError={handlePhotoError} />
        </div>
      )}

      <div className={styles.result}>
        {value
          ? <ColorSwatch color={value} size="xl" label="Color objetivo" />
          : <PixelText variant="body" tone="soft">Todavía no elegiste ningún color.</PixelText>}
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

      <PixelButton size="lg" disabled={!value} onClick={onNext}>Siguiente</PixelButton>
    </div>
  )
}
