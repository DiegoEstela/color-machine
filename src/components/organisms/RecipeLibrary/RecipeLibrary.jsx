import { useState } from 'react'
import { PixelButton, PixelJar, PixelText } from '../../atoms/index.js'
import { RecipeCard, RecipeNameForm } from '../../molecules/index.js'
import styles from './RecipeLibrary.module.css'

/** "Mis recetas": lista de la más nueva a la más vieja, con estados de carga, error y vacío. */
export default function RecipeLibrary({ recipes, status, error, onOpen, onRename, onRemove, onRetry, onCreate }) {
  const [editingId, setEditingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  if (status === 'loading' || status === 'idle') {
    return <PixelText variant="body" tone="soft" role="status">Cargando tus recetas...</PixelText>
  }
  if (status === 'error') {
    return (
      <div className={styles.stack}>
        <PixelText variant="body" tone="danger" role="alert">{error}</PixelText>
        <PixelButton variant="secondary" onClick={onRetry}>Reintentar</PixelButton>
      </div>
    )
  }
  if (recipes.length === 0) {
    return (
      <div className={styles.empty}>
        <PixelJar size="lg" />
        <PixelText size="sm">Todavía no guardaste recetas.</PixelText>
        <PixelText variant="body" tone="soft">Cuando termines una mezcla, guardala con un nombre y la vas a encontrar acá.</PixelText>
        <PixelButton icon="pot" onClick={onCreate}>Crear una mezcla</PixelButton>
      </div>
    )
  }

  return (
    <div className={styles.stack}>
      {actionError && <PixelText variant="body" tone="danger" role="alert">{actionError}</PixelText>}
      <ul className={styles.list}>
        {recipes.map((recipe) =>
          recipe.id === editingId ? (
            <li key={recipe.id} className={styles.editing}>
              <RecipeNameForm
                initialName={recipe.name}
                submitLabel="Guardar cambios"
                onCancel={() => setEditingId(null)}
                onSubmit={async (name) => {
                  const result = await onRename(recipe.id, name)
                  if (!result?.error) setEditingId(null)
                  return result
                }}
              />
            </li>
          ) : (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpen={() => onOpen(recipe.id)}
              onRename={() => { setActionError(null); setEditingId(recipe.id) }}
              onDelete={async () => {
                const result = await onRemove(recipe.id)
                setActionError(result?.error ?? null)
              }}
            />
          ),
        )}
      </ul>
    </div>
  )
}
