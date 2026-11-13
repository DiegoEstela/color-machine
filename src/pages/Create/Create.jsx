import { PixelButton, PixelText, ColorSwatch } from '../../components/atoms/index.js'
import { TargetColorPicker } from '../../components/organisms/index.js'
import { WizardLayout } from '../../components/templates/index.js'
import { TOTAL_STEPS, useMixStore } from '../../features/color-mixer/mixStore.js'
import styles from './Create.module.css'

export default function Create() {
  const step = useMixStore((s) => s.step)
  const targetColor = useMixStore((s) => s.targetColor)
  const { setTarget, next, back } = useMixStore.getState()

  if (step === 1) {
    return (
      <WizardLayout step={1} total={TOTAL_STEPS} title="Elegí tu color">
        <TargetColorPicker value={targetColor} onChange={setTarget} onNext={next} />
      </WizardLayout>
    )
  }

  // Provisorio: el paso 2 (pinturas) llega en el próximo spec.
  return (
    <WizardLayout step={step} total={TOTAL_STEPS} title="Tus pinturas">
      <div className={styles.stack}>
        <ColorSwatch color={targetColor} size="xl" label="Color objetivo" />
        <PixelText variant="body" tone="soft">Próximamente: sacale fotos a tus pinturas y etiquetalas.</PixelText>
        <PixelButton variant="secondary" onClick={back}>Volver</PixelButton>
      </div>
    </WizardLayout>
  )
}
