import { useState } from 'react'
import { PixelButton, PixelInput, PixelText } from '../../atoms/index.js'
import { validateRecipeName } from '../../../features/recipes/validation.js'
import styles from './RecipeNameForm.module.css'

/**
 * Nombre de una receta (para guardarla o renombrarla). `onSubmit(nombre)` devuelve `{ error? }`;
 * el campo empieza vacío salvo que se pase `initialName`.
 */
export default function RecipeNameForm({ initialName = '', submitLabel = 'Guardar', onSubmit, onCancel }) {
  const [name, setName] = useState(initialName)
  const [error, setError] = useState(null)
  const [serverError, setServerError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    const checked = validateRecipeName(name)
    setError(checked.error)
    setServerError(null)
    if (checked.error) return
    setBusy(true)
    const result = await onSubmit(checked.value)
    setBusy(false)
    if (result?.error) setServerError(result.error)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <PixelInput
        label="Nombre de la receta"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={error ?? undefined}
        placeholder="Mi violeta"
        autoComplete="off"
      />
      {serverError && <PixelText variant="body" tone="danger" role="alert">{serverError}</PixelText>}
      <div className={styles.actions}>
        <PixelButton type="submit" disabled={busy}>{busy ? 'Guardando...' : submitLabel}</PixelButton>
        <PixelButton variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</PixelButton>
      </div>
    </form>
  )
}
