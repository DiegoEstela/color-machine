import { useState } from 'react'
import { PixelButton, PixelPanel, PixelText } from '../../atoms/index.js'
import PlanAdvice from '../PlanAdvice/PlanAdvice.jsx'
import styles from './ImproveAdvice.module.css'

/**
 * "Para acercarte más": cómo está la mezcla, qué agregar, qué cambiar y un consejo del tipo de color.
 * - `needsHelp` (ΔE ≥ 5): viene abierto y amarillo. Si no (ΔE entre 2 y 5): una línea plegada que se abre con un toque.
 * - `gap`: `{ sentences }` de `describeGap`. `plan`: consejo completo (colores que faltan). `fallback`: qué mostrar si el plan todavía no llegó.
 * - `precision`: `{ label, quality, summary }` si una precisión mayor ayuda; `onUsePrecision()` la aplica.
 * - `toneAdvice`: frase de `adviceForTone`. `tip`: `{ text }` de `colorFamilyTip`.
 * - `space`, `onAdd`, `onAddAll`: igual que en `PlanAdvice`.
 */
export default function ImproveAdvice({
  needsHelp, gap, plan, fallback = null, precision, onUsePrecision, toneAdvice, tip, space, onAdd, onAddAll,
}) {
  const [open, setOpen] = useState(Boolean(needsHelp))
  const expanded = needsHelp || open
  const label = needsHelp ? 'Con estas pinturas no se llega del todo' : 'Podría estar más cerca'

  return (
    <PixelPanel tone={needsHelp ? 'yellow' : 'sky'} padding="xs" role="note" aria-label={label}>
      <div className={styles.root}>
        {needsHelp ? (
          <PixelText as="h3" size="xs" className={styles.title}>Para acercarte más</PixelText>
        ) : (
          <button type="button" className={styles.toggle} aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <PixelText as="span" size="xs">Podría estar más cerca</PixelText>
            <PixelText as="span" size="xs" tone="soft">{open ? 'Ocultar ▴' : 'Ver cómo ▾'}</PixelText>
          </button>
        )}

        {expanded && (
          <>
            {gap && (
              <section className={styles.section} aria-label="Cómo está tu mezcla">
                <PixelText variant="body" size="sm">{gap.sentences.join(' ')}</PixelText>
              </section>
            )}

            <section className={styles.section} aria-label="Qué agregar">
              {plan ? <PlanAdvice plan={plan} space={space} onAdd={onAdd} onAddAll={onAddAll} /> : fallback}
            </section>

            {(precision || toneAdvice) && (
              <section className={styles.section} aria-label="Qué cambiar">
                {toneAdvice && <PixelText variant="body" size="sm">{toneAdvice}</PixelText>}
                {precision && (
                  <>
                    <PixelText variant="body" size="sm">
                      Con {precision.label} queda {precision.quality.toLowerCase()}{precision.summary ? `: ${precision.summary}` : ''}.
                    </PixelText>
                    <PixelButton size="sm" variant="secondary" onClick={onUsePrecision}>Usar {precision.label}</PixelButton>
                  </>
                )}
              </section>
            )}

            {tip && (
              <PixelText variant="body" size="sm" tone="soft" role="note" aria-label="Consejo para este tipo de color">{tip.text}</PixelText>
            )}
          </>
        )}
      </div>
    </PixelPanel>
  )
}
