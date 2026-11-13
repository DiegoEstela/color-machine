import { PixelJar, PixelText } from '../../atoms/index.js'
import InfoSheet from '../InfoSheet/InfoSheet.jsx'
import { describePlan } from '../../../features/color-mixer/advisor.js'
import { BASE_PAINTS } from '../../../features/color-mixer/referencePaints.js'
import styles from './PaintPicker.module.css'

function Item({ paint, disabled, onPick }) {
  return (
    <li>
      <button type="button" className={styles.item} disabled={disabled} aria-label={`Sumar ${paint.name}`} onClick={() => onPick(paint)}>
        <PixelJar color={paint.hex} size="sm" />
        <span className={styles.text}>
          <PixelText as="span" size="sm">{paint.name}</PixelText>
          <PixelText as="span" size="xs" tone="soft">{paint.hex}</PixelText>
        </span>
      </button>
    </li>
  )
}

/**
 * Selector para sumar otro color a la receta: arriba lo que conviene sumar para acercarse al color buscado
 * (`plan`, el consejo completo), después Mis pinturas y las estándar. `canAdd(pintura)` dice si todavía entra.
 * `onPick(pintura)` suma una parte y el selector se cierra.
 */
export default function PaintPicker({ open, onClose, paints = [], plan = null, planLoading = false, canAdd, onPick }) {
  const pick = (paint) => { onPick(paint); onClose() }
  const suggested = plan?.roles ?? []
  const anyAddable = [...suggested, ...paints, ...BASE_PAINTS].some((p) => canAdd(p))
  return (
    <InfoSheet open={open} onClose={onClose} title="Sumar otro color" closeLabel="Cerrar">
      {!anyAddable && (
        <PixelText variant="body" size="sm" tone="soft" role="status">
          Ya hay el máximo de pinturas distintas. Quitá una para sumar otra, o sumá una parte a una que ya está.
        </PixelText>
      )}
      {planLoading && <PixelText variant="body" size="sm" tone="soft" role="status">Buscando qué te conviene sumar...</PixelText>}
      {plan && (
        <section className={styles.section} aria-label="Te conviene sumar">
          <PixelText as="h3" size="xs">Te conviene sumar</PixelText>
          <PixelText variant="body" size="sm">{describePlan(plan)}</PixelText>
          {suggested.length > 0 && (
            <ul className={styles.list}>
              {suggested.map((p) => <Item key={p.id} paint={p} disabled={!canAdd(p)} onPick={pick} />)}
            </ul>
          )}
        </section>
      )}
      <section className={styles.section} aria-label="Mis pinturas">
        <PixelText as="h3" size="xs">Mis pinturas</PixelText>
        {paints.length === 0 ? (
          <PixelText variant="body" size="sm" tone="soft">Todavía no tenés pinturas guardadas.</PixelText>
        ) : (
          <ul className={styles.list}>
            {paints.map((p) => <Item key={p.id} paint={p} disabled={!canAdd(p)} onPick={pick} />)}
          </ul>
        )}
      </section>
      <section className={styles.section} aria-label="Pinturas estándar">
        <PixelText as="h3" size="xs">Estándar</PixelText>
        <ul className={styles.list}>
          {BASE_PAINTS.map((p) => <Item key={p.id} paint={p} disabled={!canAdd(p)} onPick={pick} />)}
        </ul>
      </section>
    </InfoSheet>
  )
}
