import { PixelButton, PixelJar, PixelPanel, PixelSparkle, PixelText } from '../../atoms/index.js'
import styles from './PaintAdvice.module.css'

/**
 * Consejo de pinturas para el color objetivo. `items` = [{ role, status: 'have' | 'missing', paint? }].
 * Las que faltan tienen un botón "Agregar" que avisa con `onAdd(role)`.
 */
export default function PaintAdvice({ items, onAdd }) {
  if (items.length === 0) return null
  const missing = items.filter((i) => i.status === 'missing')
  return (
    <PixelPanel
      tone="yellow"
      padding="sm"
      role="region"
      aria-label="Consejo de pinturas"
      title={<><PixelSparkle size={16} tone="pink" /><span>Consejo</span></>}
    >
      <div className={styles.root}>
        <PixelText size="xs">Para este color te conviene tener:</PixelText>
        <ul className={styles.list}>
          {items.map(({ role, status, paint }) => (
            <li key={role.id} className={styles.item} data-status={status}>
              <PixelJar color={role.hex} size="sm" label={role.name} />
              <PixelText as="span" size="sm">{role.name}</PixelText>
              {status === 'have' ? (
                <PixelText as="span" size="xs" tone="soft">
                  la tenés{paint && paint.name !== role.name ? ` (${paint.name})` : ''}
                </PixelText>
              ) : (
                <PixelButton size="sm" variant="secondary" icon="jar" onClick={() => onAdd(role)} aria-label={`Agregar ${role.name}`}>
                  Agregar
                </PixelButton>
              )}
            </li>
          ))}
        </ul>
        {missing.length === 0 && <PixelText variant="body" size="sm" tone="soft">Ya tenés todo lo necesario.</PixelText>}
      </div>
    </PixelPanel>
  )
}
