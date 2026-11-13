import { useState } from 'react'
import { PixelButton, PixelIcon, PixelJar, PixelText } from '../../atoms/index.js'
import { formatRecipeDate } from '../../../features/recipes/format.js'
import { summarizeMix } from '../../../features/recipes/validation.js'
import styles from './RecipeCard.module.css'

/** Una receta guardada: tocarla abre el detalle; Renombrar y Borrar (con confirmación) a un costado. */
export default function RecipeCard({ recipe, onOpen, onRename, onDelete }) {
  const [confirming, setConfirming] = useState(false)

  return (
    <li className={styles.card}>
      <button type="button" className={styles.main} onClick={onOpen}>
        <span className={styles.jars} aria-hidden="true">
          <PixelJar color={recipe.target_hex} size="sm" />
          <PixelIcon name="back" size={12} />
          <PixelJar color={recipe.result_hex} size="sm" />
        </span>
        <span className={styles.text}>
          <PixelText as="span" size="sm">{recipe.name}</PixelText>
          <PixelText as="span" variant="body" size="sm" tone="soft">{summarizeMix(recipe.mix)}</PixelText>
          <PixelText as="span" size="xs" tone="soft">{formatRecipeDate(recipe.created_at)}</PixelText>
        </span>
      </button>

      <div className={styles.actions}>
        {confirming ? (
          <>
            <PixelButton variant="danger" size="sm" onClick={() => { setConfirming(false); onDelete() }}>Confirmar</PixelButton>
            <PixelButton variant="secondary" size="sm" onClick={() => setConfirming(false)}>No</PixelButton>
          </>
        ) : (
          <>
            <PixelButton variant="secondary" size="sm" onClick={onRename}>Renombrar</PixelButton>
            <PixelButton variant="danger" size="sm" onClick={() => setConfirming(true)}>Borrar</PixelButton>
          </>
        )}
      </div>
    </li>
  )
}
