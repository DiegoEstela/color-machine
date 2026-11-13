import { PixelButton, PixelJar, PixelText } from '../../components/atoms/index.js'
import { StepIndicator } from '../../components/molecules/index.js'
import { MixResult, PaintsStep, TargetColorPicker } from '../../components/organisms/index.js'
import { AppShell } from '../../components/templates/index.js'
import { TOTAL_STEPS, useMixStore } from '../../features/color-mixer/mixStore.js'
import { usePaintsStore } from '../../features/paints/paintsStore.js'
import styles from './Create.module.css'

const TITLES = { 1: 'Elegí tu color', 2: 'Tus pinturas', 3: 'Tu mezcla' }

function TargetReference({ color, thumb }) {
  return (
    <div className={styles.reference}>
      {thumb && <img src={thumb} alt="Recorte de tu color" className={styles.thumb} />}
      <PixelJar color={color} size="sm" label="Color objetivo" />
      <PixelText size="xs" tone="soft">Tu color objetivo</PixelText>
    </div>
  )
}

/** Pestaña "Crear": el asistente de 3 pasos. El estado vive en los stores, así que cambiar de pestaña no lo pierde. */
export default function Create() {
  const step = useMixStore((s) => s.step)
  return (
    <AppShell
      title={TITLES[step]}
      activeTab="create"
      scrollKey={step}
      actions={<StepIndicator step={step} total={TOTAL_STEPS} compact />}
    >
      {/* `key` reinicia la animación de entrada en cada paso */}
      <div key={step} className={styles.enter}><Steps /></div>
    </AppShell>
  )
}

function Steps() {
  const step = useMixStore((s) => s.step)
  const targetColor = useMixStore((s) => s.targetColor)
  const targetThumb = useMixStore((s) => s.targetThumb)
  const { setTarget, setTargetThumb, next, back } = useMixStore.getState()
  const paints = usePaintsStore((s) => s.paints)
  const selectedIds = usePaintsStore((s) => s.selectedIds)

  if (step === 1) {
    return (
      <TargetColorPicker
        value={targetColor}
        thumbnail={targetThumb}
        onChange={setTarget}
        onThumbnail={setTargetThumb}
        onNext={next}
      />
    )
  }

  if (step === 2) {
    return (
      <div className={styles.stack}>
        <TargetReference color={targetColor} thumb={targetThumb} />
        <PaintsStep target={targetColor} onBack={back} onNext={next} />
      </div>
    )
  }

  // Paso 3: la mezcla. Las pinturas se usan en el orden en que se eligieron.
  const chosen = selectedIds.map((id) => paints.find((p) => p.id === id)).filter(Boolean)
  const addPaint = (role) => {
    usePaintsStore.getState().setPendingName(role.name)
    back() // vuelve al paso 2, que abre el alta con ese nombre
  }
  return (
    <div className={styles.stack}>
      <MixResult target={targetColor} paints={chosen} onAddPaint={addPaint} />
      <PixelButton variant="secondary" onClick={back}>Volver</PixelButton>
    </div>
  )
}
