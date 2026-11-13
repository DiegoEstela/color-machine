import styles from './ColorSwatch.module.css'

/** Muestra un color. Con onClick se comporta como botón seleccionable. */
export default function ColorSwatch({ color, size = 'md', selected = false, label, onClick }) {
  const name = label ? `${label} ${color}` : color
  const common = {
    className: styles.swatch,
    'data-size': size,
    'data-selected': selected || undefined,
    style: { '--swatch-color': color },
  }
  if (onClick) {
    return <button type="button" aria-label={name} aria-pressed={selected} onClick={onClick} {...common} />
  }
  return <div role="img" aria-label={name} {...common} />
}
