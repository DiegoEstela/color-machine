import { useEffect, useMemo, useState } from 'react'
import { PixelButton, PixelText } from '../../atoms/index.js'
import { PaintAdvice } from '../../molecules/index.js'
import PaintCapture from '../PaintCapture/PaintCapture.jsx'
import PaintList from '../PaintList/PaintList.jsx'
import { adviseBasePaints, matchPaints } from '../../../features/color-mixer/advisor.js'
import { MAX_SELECTED, MIN_SELECTED, usePaintsStore } from '../../../features/paints/paintsStore.js'
import styles from './PaintsStep.module.css'

/** Paso 2: mis pinturas (guardadas en la cuenta), alta de nuevas y selección de las que se usarán. */
export default function PaintsStep({ target, onBack, onNext }) {
  const { paints, selectedIds, thumbs, status, error } = usePaintsStore()
  const { load, add, update, remove, toggleSelect } = usePaintsStore.getState()
  // Si se llega desde un consejo ("Agregar Blanco"), se abre el alta con el nombre ya puesto.
  const [suggestedName] = useState(() => usePaintsStore.getState().pendingName ?? '')
  const [adding, setAdding] = useState(Boolean(suggestedName))
  const [name, setName] = useState(suggestedName)
  const [notice, setNotice] = useState(null)

  useEffect(() => { usePaintsStore.getState().setPendingName(null) }, [])

  const roles = useMemo(() => (target ? adviseBasePaints(target).roles : []), [target])
  const advice = useMemo(() => matchPaints(roles, paints), [roles, paints])

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
        initialName={name}
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
      {status === 'ready' && (
        <PaintAdvice items={advice} onAdd={(role) => { setName(role.name); setAdding(true) }} />
      )}
      <PixelButton variant="secondary" onClick={() => { setName(''); setAdding(true) }}>Agregar pintura</PixelButton>

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
