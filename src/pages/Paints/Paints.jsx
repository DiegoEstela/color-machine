import { useEffect, useState } from 'react'
import { PixelButton } from '../../components/atoms/index.js'
import { PaintCapture, PaintList } from '../../components/organisms/index.js'
import { AppShell } from '../../components/templates/index.js'
import { usePaintsStore } from '../../features/paints/paintsStore.js'
import styles from './Paints.module.css'

/** "Mis pinturas" (`#/pinturas`, desde el menú lateral): ver, agregar, editar y borrar. Acá no se seleccionan para mezclar. */
export default function Paints() {
  const { paints, thumbs, status, error } = usePaintsStore()
  const { load, add, update, remove } = usePaintsStore.getState()
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    if (usePaintsStore.getState().status === 'idle') usePaintsStore.getState().load()
  }, [])

  return (
    <AppShell title="Mis pinturas" scrollKey={adding}>
      {adding ? (
        <PaintCapture onSubmit={add} onCancel={() => setAdding(false)} onDone={() => setAdding(false)} />
      ) : (
        <div className={styles.stack}>
          <PixelButton icon="plus" onClick={() => setAdding(true)}>Agregar pintura</PixelButton>
          <PaintList
            paints={paints}
            selectedIds={[]}
            thumbs={thumbs}
            status={status}
            error={error}
            onUpdate={update}
            onRemove={remove}
            onRetry={load}
          />
        </div>
      )}
    </AppShell>
  )
}
