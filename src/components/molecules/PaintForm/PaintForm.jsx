import { useState } from 'react'
import { PixelButton, PixelInput, PixelText } from '../../atoms/index.js'
import { normalizeHex } from '../../../lib/color.js'
import { validatePaint } from '../../../features/paints/validation.js'
import styles from './PaintForm.module.css'

/**
 * Nombre + color (hex) de una pintura. El hex es controlado por el padre (`hex`, `onHexChange`)
 * para poder sincronizarlo con el recorte de la foto. `onSubmit({ name, hex })` devuelve `{ error? }`.
 */
export default function PaintForm({ initialName = '', hex, onHexChange, onSubmit, onCancel, submitLabel = 'Guardar' }) {
  const [name, setName] = useState(initialName)
  const [draft, setDraft] = useState(null) // texto del hex mientras se edita
  const [errors, setErrors] = useState({})
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  const handleHex = (e) => {
    const text = e.target.value
    setDraft(text)
    const normalized = normalizeHex(text)
    if (normalized) onHexChange(normalized)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const { errors: found, values } = validatePaint({ name, hex: draft ?? hex })
    setErrors(found)
    setServerError(null)
    if (!values) return
    setBusy(true)
    const result = await onSubmit(values)
    setBusy(false)
    if (result?.error) setServerError(result.error)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <PixelInput
        label="Nombre"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        placeholder="Rojo"
        maxLength={60}
        autoComplete="off"
      />
      <PixelInput
        label="Color (hex)"
        value={draft ?? hex ?? ''}
        onChange={handleHex}
        onBlur={() => setDraft(null)}
        error={errors.hex}
        placeholder="#e63946"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      {serverError && <PixelText variant="body" tone="danger" role="alert">{serverError}</PixelText>}
      <div className={styles.actions}>
        <PixelButton type="submit" disabled={busy}>{busy ? 'Guardando...' : submitLabel}</PixelButton>
        <PixelButton variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</PixelButton>
      </div>
    </form>
  )
}
