import { useState } from 'react'
import { PixelButton, PixelSparkle, PixelText } from '../../atoms/index.js'
import RecipeNameForm from '../RecipeNameForm/RecipeNameForm.jsx'
import styles from './SaveRecipe.module.css'

/**
 * Guardar la receta que se está viendo: botón → formulario de nombre (vacío) → confirmación.
 * `onSave(nombre)` devuelve `{ error? }`. Si `saved`, muestra "¡Receta guardada!" y el botón queda en "Guardada".
 */
export default function SaveRecipe({ saved, onSave, onOpenLibrary }) {
  const [open, setOpen] = useState(false)

  if (saved) {
    return (
      <div className={styles.saved}>
        <div className={styles.message}>
          <PixelSparkle size={14} tone="yellow" />
          <PixelText size="sm">¡Receta guardada!</PixelText>
        </div>
        <div className={styles.actions}>
          <PixelButton variant="secondary" icon="check" disabled>Guardada</PixelButton>
          <PixelButton icon="book" onClick={onOpenLibrary}>Ver mis recetas</PixelButton>
        </div>
      </div>
    )
  }

  if (open) {
    return (
      <RecipeNameForm
        onCancel={() => setOpen(false)}
        onSubmit={async (name) => {
          const result = await onSave(name)
          if (!result?.error) setOpen(false)
          return result
        }}
      />
    )
  }

  return <PixelButton icon="save" onClick={() => setOpen(true)}>Guardar receta</PixelButton>
}
