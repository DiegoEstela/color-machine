import { useState } from 'react'
import { PixelButton, PixelText } from '../../atoms/index.js'
import { PaintCard, PaintForm } from '../../molecules/index.js'
import styles from './PaintList.module.css'

/** Lista de "Mis pinturas" con selección, edición y borrado. Maneja los estados de carga, error y vacío. */
export default function PaintList({
  paints, selectedIds, thumbs, status, error, onToggle, onUpdate, onRemove, onRetry,
}) {
  const [editingId, setEditingId] = useState(null)
  const [editHex, setEditHex] = useState(null)
  const [actionError, setActionError] = useState(null)

  if (status === 'loading' || status === 'idle') {
    return <PixelText variant="body" tone="soft" role="status">Cargando tus pinturas...</PixelText>
  }
  if (status === 'error') {
    return (
      <div className={styles.stack}>
        <PixelText variant="body" tone="danger" role="alert">{error}</PixelText>
        <PixelButton variant="secondary" onClick={onRetry}>Reintentar</PixelButton>
      </div>
    )
  }
  if (paints.length === 0) {
    return <PixelText variant="body" tone="soft">Todavía no tenés pinturas. Agregá la primera.</PixelText>
  }

  const startEdit = (paint) => { setActionError(null); setEditingId(paint.id); setEditHex(paint.hex) }

  return (
    <div className={styles.stack}>
      {actionError && <PixelText variant="body" tone="danger" role="alert">{actionError}</PixelText>}
      <ul className={styles.list}>
        {paints.map((paint) =>
          paint.id === editingId ? (
            <li key={paint.id} className={styles.editing}>
              <PaintForm
                initialName={paint.name}
                hex={editHex}
                onHexChange={setEditHex}
                submitLabel="Guardar cambios"
                onCancel={() => setEditingId(null)}
                onSubmit={async (values) => {
                  const result = await onUpdate(paint.id, values)
                  if (!result?.error) setEditingId(null)
                  return result
                }}
              />
            </li>
          ) : (
            <PaintCard
              key={paint.id}
              paint={paint}
              thumb={thumbs[paint.id]}
              selected={selectedIds.includes(paint.id)}
              onToggle={() => onToggle(paint.id)}
              onEdit={() => startEdit(paint)}
              onDelete={async () => {
                const result = await onRemove(paint.id)
                setActionError(result?.error ?? null)
              }}
            />
          ),
        )}
      </ul>
    </div>
  )
}
