import { PixelButton, PixelText } from '../../atoms/index.js'
import { describePlan } from '../../../features/color-mixer/advisor.js'
import styles from './PlanAdvice.module.css'

/**
 * Consejo completo (`advisor.planMissingPaints`): dice **todos** los colores que faltan, cómo queda la receta con ellos
 * y deja sumarlos con un toque. `space` = cuántas pinturas más entran en la mezcla (el máximo menos las que ya hay).
 * `onAdd(role)` suma uno; `onAddAll(roles)` suma todos los del plan.
 */
export default function PlanAdvice({ plan, space, onAdd, onAddAll }) {
  if (!plan) return null
  const { roles } = plan
  const allFit = roles.length <= space
  const single = roles.length === 1
  return (
    <div className={styles.root}>
      <PixelText variant="body" size="sm">{describePlan(plan)}</PixelText>
      {roles.length > 0 && (
        <div className={styles.buttons}>
          {roles.length > 1 && (
            <PixelButton size="sm" icon="plus" disabled={!allFit} onClick={() => onAddAll(roles)}>
              Agregar todos
            </PixelButton>
          )}
          {roles.map((role) => (
            <PixelButton
              key={role.id}
              size="sm"
              variant="secondary"
              icon="plus"
              disabled={space <= 0}
              aria-label={single ? `Sumar ${role.name}, quedaría ${plan.quality.toLowerCase()}` : `Sumar ${role.name}, parte del plan`}
              onClick={() => onAdd(role)}
            >
              <span className={styles.label}>
                <span>{role.name}</span>
                <span className={styles.hint}>{single ? `quedaría ${plan.quality.toLowerCase()}` : 'parte del plan'}</span>
              </span>
            </PixelButton>
          ))}
        </div>
      )}
      {roles.length > 0 && !allFit && (
        <PixelText variant="body" size="sm" tone="soft" role="status">
          {space <= 0
            ? 'Ya usás el máximo de pinturas por mezcla. Quitá una para sumar otra.'
            : `Solo entran ${space} pintura${space === 1 ? '' : 's'} más. Quitá una para sumar todos.`}
        </PixelText>
      )}
    </div>
  )
}
