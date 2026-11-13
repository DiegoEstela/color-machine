import { useState } from 'react'
import { PixelButton, PixelJar, PixelText } from '../../atoms/index.js'
import styles from './PaintCard.module.css'

/**
 * Una pintura: tocarla la selecciona; Editar y Borrar (con confirmación) a un costado.
 * Sin `onToggle` (pantalla Mis pinturas) no se puede seleccionar: se muestra solo la información.
 */
export default function PaintCard({ paint, thumb, selected, onToggle, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const content = (
    <>
      {thumb
        ? <img src={thumb} alt="" className={styles.thumb} />
        : <PixelJar color={paint.hex} size="md" />}
      <span className={styles.text}>
        <PixelText as="span" size="sm">{paint.name}</PixelText>
        <PixelText as="span" size="xs" tone="soft">{paint.hex}</PixelText>
      </span>
    </>
  )

  return (
    <li className={styles.card} data-selected={selected || undefined}>
      {onToggle ? (
        <button
          type="button"
          className={styles.main}
          aria-pressed={selected}
          aria-label={`${paint.name} ${paint.hex}`}
          onClick={onToggle}
        >
          {content}
          <PixelText as="span" size="sm" aria-hidden="true">{selected ? '[x]' : '[ ]'}</PixelText>
        </button>
      ) : (
        <div className={`${styles.main} ${styles.static}`}>{content}</div>
      )}

      <div className={styles.actions}>
        {confirming ? (
          <>
            <PixelButton variant="danger" size="sm" onClick={() => { setConfirming(false); onDelete() }}>
              Confirmar
            </PixelButton>
            <PixelButton variant="secondary" size="sm" onClick={() => setConfirming(false)}>No</PixelButton>
          </>
        ) : (
          <>
            <PixelButton variant="secondary" size="sm" onClick={onEdit}>Editar</PixelButton>
            <PixelButton variant="danger" size="sm" onClick={() => setConfirming(true)}>Borrar</PixelButton>
          </>
        )}
      </div>
    </li>
  )
}
