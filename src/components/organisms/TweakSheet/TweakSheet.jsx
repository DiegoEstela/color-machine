import { PixelButton, PixelText } from '../../atoms/index.js'
import { ColorCompare, InfoSheet, TweakControl } from '../../molecules/index.js'
import { describeQuality } from '../../../features/color-mixer/solver.js'
import { describeGap, isNeutral } from '../../../features/color-mixer/tweak.js'
import styles from './TweakSheet.module.css'

/**
 * Panel "Ajustar tu mezcla": Luz e Intensidad con la comparación en vivo y, si hace falta, qué sumar.
 * - `target`: el color original (el parecido siempre se mide contra él). `shown`: la receta que se está viendo.
 * - `tweak` / `onChange` / `onReset`: el ajuste actual `{ light, vivid }` y sus acciones.
 * - `needs`: frases de qué falta ("Te falta blanco…"). `suggestions`: `[{ role, deltaE }]` para los botones "+ Color".
 * - `busy`: se está recalculando (los controles esperan). `atLimit`: ya hay el máximo de pinturas.
 */
export default function TweakSheet({
  open, onClose, target, shown, tweak, onChange, onReset, needs = [], suggestions = [], onAdd, busy = false, atLimit = false,
}) {
  const gap = shown ? describeGap(target, shown.mixHex) : null
  return (
    <InfoSheet open={open} onClose={onClose} title="Ajustar tu mezcla" closeLabel="Listo">
      {shown && (
        <ColorCompare compact target={target} mix={shown.mixHex} quality={shown.quality} deltaE={shown.deltaE} />
      )}
      <PixelText variant="body" size="sm" tone="soft" role="status">
        {busy ? 'Calculando...' : gap?.sentences.join(' ')}
      </PixelText>

      <TweakControl
        label="Luz"
        lowLabel="Más oscuro"
        highLabel="Más claro"
        value={tweak.light}
        disabled={busy}
        onChange={(light) => onChange({ ...tweak, light })}
      />
      <TweakControl
        label="Intensidad"
        lowLabel="Más apagado"
        highLabel="Más intenso"
        value={tweak.vivid}
        disabled={busy}
        onChange={(vivid) => onChange({ ...tweak, vivid })}
      />

      {!busy && needs.length > 0 && (
        <div className={styles.needs} role="note" aria-label="Qué te falta">
          <PixelText variant="body" size="sm">{needs.join(' ')}</PixelText>
          {suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((s) => (
                <PixelButton
                  key={s.role.id}
                  size="sm"
                  variant="secondary"
                  icon="plus"
                  disabled={atLimit}
                  aria-label={`Sumar ${s.role.name}, quedaría ${describeQuality(s.deltaE).toLowerCase()}`}
                  onClick={() => onAdd(s.role)}
                >
                  <span className={styles.suggestion}>
                    <span>{s.role.name}</span>
                    <span className={styles.hint}>quedaría {describeQuality(s.deltaE).toLowerCase()}</span>
                  </span>
                </PixelButton>
              ))}
            </div>
          )}
          {atLimit && suggestions.length > 0 && (
            <PixelText variant="body" size="sm" tone="soft" role="status">Ya usás el máximo de pinturas. Quitá una para sumar otra.</PixelText>
          )}
        </div>
      )}

      <PixelButton variant="secondary" size="sm" disabled={isNeutral(tweak)} onClick={onReset}>Restablecer</PixelButton>
    </InfoSheet>
  )
}
