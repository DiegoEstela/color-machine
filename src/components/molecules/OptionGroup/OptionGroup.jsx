import { useId, useRef } from 'react'
import { PixelButton, PixelText } from '../../atoms/index.js'
import styles from './OptionGroup.module.css'

/**
 * Grupo de opciones excluyentes (radiogroup) con título, subtítulo por opción y una frase que explica
 * la opción elegida. Navegable con flechas. `compact` oculta título, subtítulos y frase (queda accesible).
 * `columns` fija cuántas opciones van por fila (por defecto, todas en una fila).
 * `labelAction` es un nodo (por ejemplo un botón ⓘ) que va a la derecha del título.
 * `options` = [{ id, label, hint?, description? }].
 */
export default function OptionGroup({ label, options, value, onChange, compact = false, columns, labelAction }) {
  const labelId = useId()
  const refs = useRef([])
  const selected = options.find((o) => o.id === value)

  const move = (index, step) => {
    const next = (index + step + options.length) % options.length
    onChange(options[next].id)
    refs.current[next]?.focus()
  }
  const onKeyDown = (e, i) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(i, 1) }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(i, -1) }
  }

  return (
    <div className={styles.root} data-compact={compact || undefined}>
      <div className={compact ? styles.hidden : styles.head}>
        <PixelText as="span" size="xs" id={labelId}>{label}</PixelText>
        {labelAction}
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className={styles.options}
        style={{ '--columns': columns ?? options.length }}
      >
        {options.map((o, i) => (
          <PixelButton
            key={o.id}
            ref={(el) => { refs.current[i] = el }}
            role="radio"
            aria-checked={o.id === value}
            tabIndex={o.id === value ? 0 : -1}
            size="sm"
            variant={o.id === value ? 'primary' : 'secondary'}
            onClick={() => onChange(o.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            <span className={styles.option}>
              <span>{o.label}</span>
              {!compact && o.hint && <span className={styles.hint}>{o.hint}</span>}
            </span>
          </PixelButton>
        ))}
      </div>
      {!compact && selected?.description && (
        <PixelText variant="body" size="sm" tone="soft" aria-live="polite">{selected.description}</PixelText>
      )}
    </div>
  )
}
