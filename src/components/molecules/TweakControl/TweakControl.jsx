import { PixelIconButton, PixelText } from '../../atoms/index.js'
import styles from './TweakControl.module.css'

/**
 * Un eje del ajuste de la mezcla (por ejemplo, Luz): botones − y + con un indicador de pasos en el medio.
 * `value` va de -limit a +limit; 0 es "como está". El indicador es un `slider` accesible: con flechas también se mueve.
 * `lowLabel` / `highLabel` nombran los extremos ("Más oscuro" / "Más claro") y son el nombre de los botones.
 * `stepNames` = `(n) => 'texto'` para el valor leído por lectores de pantalla.
 */
export default function TweakControl({ label, lowLabel, highLabel, value, onChange, limit = 3, disabled = false }) {
  const cells = Array.from({ length: limit * 2 + 1 }, (_, i) => i - limit)
  const set = (n) => onChange(Math.max(-limit, Math.min(limit, n)))
  const valueText = value === 0 ? 'Como está' : `${Math.abs(value)} ${Math.abs(value) === 1 ? 'paso' : 'pasos'} ${value > 0 ? highLabel : lowLabel}`.toLowerCase()

  const onKeyDown = (e) => {
    if (disabled) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(value + 1) }
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(value - 1) }
    else if (e.key === 'Home') { e.preventDefault(); set(-limit) }
    else if (e.key === 'End') { e.preventDefault(); set(limit) }
  }

  return (
    <div className={styles.root} role="group" aria-label={label}>
      <PixelText as="span" size="xs">{label}</PixelText>
      <div className={styles.row}>
        <PixelIconButton icon="minus" label={lowLabel} disabled={disabled || value <= -limit} onClick={() => set(value - 1)} />
        <div
          className={styles.track}
          role="slider"
          tabIndex={disabled ? -1 : 0}
          aria-label={label}
          aria-valuemin={-limit}
          aria-valuemax={limit}
          aria-valuenow={value}
          aria-valuetext={valueText}
          aria-disabled={disabled || undefined}
          onKeyDown={onKeyDown}
        >
          {cells.map((n) => (
            <span
              key={n}
              className={styles.cell}
              data-center={n === 0 || undefined}
              data-on={(value > 0 ? n > 0 && n <= value : value < 0 ? n < 0 && n >= value : false) || undefined}
            />
          ))}
        </div>
        <PixelIconButton icon="plus" label={highLabel} disabled={disabled || value >= limit} onClick={() => set(value + 1)} />
      </div>
      <div className={styles.ends} aria-hidden="true">
        <PixelText as="span" size="xs" tone="soft">{lowLabel}</PixelText>
        <PixelText as="span" size="xs" tone="soft">{highLabel}</PixelText>
      </div>
    </div>
  )
}
