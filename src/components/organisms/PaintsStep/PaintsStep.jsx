import { useEffect, useState } from 'react'
import { PixelButton, PixelText } from '../../atoms/index.js'
import PaintCapture from '../PaintCapture/PaintCapture.jsx'
import PaintList from '../PaintList/PaintList.jsx'
import { MAX_SELECTED, MIN_SELECTED, usePaintsStore } from '../../../features/paints/paintsStore.js'
import styles from './PaintsStep.module.css'

/** Paso 2: mis pinturas (guardadas en la cuenta), alta de nuevas y selección de las que se usarán. */
export default function PaintsStep({ onBack, onNext }) {
  const { paints, selectedIds, thumbs, status, error } = usePaintsStore()
  const { load, add, update, remove, toggleSelect } = usePaintsStore.getState()
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState(null)

  useEffect(() => {
    if (usePaintsStore.getState().status === 'idle') usePaintsStore.getState().load()
  }, [])

  const handleToggle = (id) => {
    const ok = toggleSelect(id)
    setNotice(ok ? null : `Máximo ${MAX_SELECTED} pinturas por mezcla.`)
  }

  if (adding) {
    return (
      <PaintCapture
        onSubmit={add}
        onCancel={() => setAdding(false)}
        onDone={() => setAdding(false)}
      />
    )
  }

  const count = selectedIds.length
  const canContinue = count >= MIN_SELECTED && count <= MAX_SELECTED

  return (
    <div className={styles.root}>
      <PixelText variant="body" tone="soft">
        Elegí con qué pinturas vas a mezclar ({MIN_SELECTED} a {MAX_SELECTED}). Si falta alguna, agregala.
      </PixelText>
      <PixelButton variant="secondary" onClick={() => setAdding(true)}>Agregar pintura</PixelButton>

      <PaintList
        paints={paints}
        selectedIds={selectedIds}
        thumbs={thumbs}
        status={status}
        error={error}
        onToggle={handleToggle}
        onUpdate={update}
        onRemove={remove}
        onRetry={load}
      />

      {notice && <PixelText variant="body" tone="danger" role="alert">{notice}</PixelText>}
      <PixelText size="xs" tone="soft" role="status">Elegidas: {count} de {MAX_SELECTED}</PixelText>

      <div className={styles.actions}>
        <PixelButton variant="secondary" onClick={onBack}>Volver</PixelButton>
        <PixelButton size="lg" disabled={!canContinue} onClick={onNext}>Siguiente</PixelButton>
      </div>
    </div>
  )
}
