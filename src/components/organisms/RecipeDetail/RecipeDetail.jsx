import { useState } from 'react'
import { PixelButton, PixelIcon, PixelPanel, PixelText } from '../../atoms/index.js'
import { ColorCompare, RecipeNameForm, RecipeRow } from '../../molecules/index.js'
import { deltaE } from '../../../features/color-mixer/mixer.js'
import { describeQuality } from '../../../features/color-mixer/solver.js'
import { formatRecipeDate } from '../../../features/recipes/format.js'
import { totalParts } from '../../../features/recipes/validation.js'
import styles from './RecipeDetail.module.css'

/**
 * Detalle de una receta guardada: comparación con el medidor, partes por pintura y acciones
 * (renombrar, borrar con confirmación y "Mezclar este color otra vez"). Las acciones devuelven `{ error? }`.
 */
export default function RecipeDetail({ recipe, onRename, onRemove, onRemix }) {
  const [renaming, setRenaming] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [actionError, setActionError] = useState(null)

  const dE = deltaE(recipe.target_hex, recipe.result_hex)
  const total = totalParts(recipe.mix)

  async function handleRemove() {
    setConfirming(false)
    const result = await onRemove(recipe.id)
    setActionError(result?.error ?? null)
  }

  return (
    <div className={styles.root}>
      <div className={styles.head}>
        <PixelText as="h2" size="md">{recipe.name}</PixelText>
        <PixelText size="xs" tone="soft">{formatRecipeDate(recipe.created_at)}</PixelText>
      </div>

      <ColorCompare target={recipe.target_hex} mix={recipe.result_hex} quality={describeQuality(dE)} deltaE={dE} />

      <ul className={styles.rows}>
        {recipe.mix.map((m, i) => (
          <RecipeRow key={`${m.name}-${i}`} name={m.name} hex={m.hex} parts={m.parts} total={total} />
        ))}
      </ul>

      <PixelPanel tone="sky" padding="sm" role="note" aria-label="Qué es una parte">
        <div className={styles.info}>
          <PixelIcon name="info" size={18} />
          <PixelText variant="body" size="sm">
            1 parte = la medida que quieras (una cucharada, una tapita). Usá la misma para todas las pinturas.
          </PixelText>
        </div>
      </PixelPanel>

      {actionError && <PixelText variant="body" tone="danger" role="alert">{actionError}</PixelText>}

      {renaming ? (
        <RecipeNameForm
          initialName={recipe.name}
          submitLabel="Guardar cambios"
          onCancel={() => setRenaming(false)}
          onSubmit={async (name) => {
            const result = await onRename(recipe.id, name)
            if (!result?.error) setRenaming(false)
            return result
          }}
        />
      ) : (
        <div className={styles.actions}>
          <PixelButton icon="wheel" onClick={() => onRemix(recipe)}>Mezclar este color otra vez</PixelButton>
          <div className={styles.row}>
            <PixelButton variant="secondary" onClick={() => { setActionError(null); setRenaming(true) }}>Renombrar</PixelButton>
            {confirming ? (
              <>
                <PixelButton variant="danger" onClick={handleRemove}>Confirmar</PixelButton>
                <PixelButton variant="secondary" onClick={() => setConfirming(false)}>No</PixelButton>
              </>
            ) : (
              <PixelButton variant="danger" onClick={() => setConfirming(true)}>Borrar</PixelButton>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
