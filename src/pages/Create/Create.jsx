import { PixelButton, PixelJar, PixelText } from '../../components/atoms/index.js'
import { MixResult, PaintsStep, TargetColorPicker } from '../../components/organisms/index.js'
import { WizardLayout } from '../../components/templates/index.js'
import { authService } from '../../features/auth/index.js'
import { TOTAL_STEPS, useMixStore } from '../../features/color-mixer/mixStore.js'
import { usePaintsStore } from '../../features/paints/paintsStore.js'
import styles from './Create.module.css'

function TargetReference({ color, thumb }) {
  return (
    <div className={styles.reference}>
      {thumb && <img src={thumb} alt="Recorte de tu color" className={styles.thumb} />}
      <PixelJar color={color} size="sm" label="Color objetivo" />
      <PixelText size="xs" tone="soft">Tu color objetivo</PixelText>
    </div>
  )
}

const signOut = () => authService.signOut()

export default function Create() {
  const step = useMixStore((s) => s.step)
  // `key` reinicia la animación de entrada en cada paso
  return <div key={step} className={styles.enter}><Steps /></div>
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
      <WizardLayout step={1} total={TOTAL_STEPS} title="Elegí tu color" onSignOut={signOut}>
        <TargetColorPicker
          value={targetColor}
          thumbnail={targetThumb}
          onChange={setTarget}
          onThumbnail={setTargetThumb}
          onNext={next}
        />
      </WizardLayout>
    )
  }

  if (step === 2) {
    return (
      <WizardLayout step={2} total={TOTAL_STEPS} title="Tus pinturas" onSignOut={signOut}>
        <div className={styles.stack}>
          <TargetReference color={targetColor} thumb={targetThumb} />
          <PaintsStep target={targetColor} onBack={back} onNext={next} />
        </div>
      </WizardLayout>
    )
  }

  // Paso 3: la mezcla. Las pinturas se usan en el orden en que se eligieron.
  const chosen = selectedIds.map((id) => paints.find((p) => p.id === id)).filter(Boolean)
  const addPaint = (role) => {
    usePaintsStore.getState().setPendingName(role.name)
    back() // vuelve al paso 2, que abre el alta con ese nombre
  }
  return (
    <WizardLayout step={step} total={TOTAL_STEPS} title="Tu mezcla" onSignOut={signOut}>
      <div className={styles.stack}>
        <MixResult target={targetColor} paints={chosen} onAddPaint={addPaint} />
        <PixelButton variant="secondary" onClick={back}>Volver</PixelButton>
      </div>
    </WizardLayout>
  )
}
