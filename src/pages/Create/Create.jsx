import { PixelButton, PixelText, ColorSwatch } from '../../components/atoms/index.js'
import { PaintsStep, TargetColorPicker } from '../../components/organisms/index.js'
import { WizardLayout } from '../../components/templates/index.js'
import { TOTAL_STEPS, useMixStore } from '../../features/color-mixer/mixStore.js'
import { usePaintsStore } from '../../features/paints/paintsStore.js'
import styles from './Create.module.css'

function TargetReference({ color, thumb }) {
  return (
    <div className={styles.reference}>
      {thumb && <img src={thumb} alt="Recorte de tu color" className={styles.thumb} />}
      <ColorSwatch color={color} size="md" label="Color objetivo" />
      <PixelText size="xs" tone="soft">Tu color objetivo</PixelText>
    </div>
  )
}

export default function Create() {
  const step = useMixStore((s) => s.step)
  const targetColor = useMixStore((s) => s.targetColor)
  const targetThumb = useMixStore((s) => s.targetThumb)
  const { setTarget, setTargetThumb, next, back } = useMixStore.getState()
  const paints = usePaintsStore((s) => s.paints)
  const selectedIds = usePaintsStore((s) => s.selectedIds)

  if (step === 1) {
    return (
      <WizardLayout step={1} total={TOTAL_STEPS} title="Elegí tu color">
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
      <WizardLayout step={2} total={TOTAL_STEPS} title="Tus pinturas">
        <div className={styles.stack}>
          <TargetReference color={targetColor} thumb={targetThumb} />
          <PaintsStep onBack={back} onNext={next} />
        </div>
      </WizardLayout>
    )
  }

  // Provisorio: el cálculo de proporciones llega en el próximo spec.
  const chosen = paints.filter((p) => selectedIds.includes(p.id))
  return (
    <WizardLayout step={step} total={TOTAL_STEPS} title="Mezcla">
      <div className={styles.stack}>
        <TargetReference color={targetColor} thumb={targetThumb} />
        <div className={styles.row}>
          {chosen.map((p) => <ColorSwatch key={p.id} color={p.hex} label={p.name} />)}
        </div>
        <PixelText variant="body" tone="soft">Próximamente: calculamos las proporciones para lograr tu color.</PixelText>
        <PixelButton variant="secondary" onClick={back}>Volver</PixelButton>
      </div>
    </WizardLayout>
  )
}
