import { useEffect } from 'react'
import { PixelButton, PixelPanel, PixelText } from '../../atoms/index.js'
import { ColorCompare, MixingAnimation, RecipeRow } from '../../molecules/index.js'
import { diagnose } from '../../../features/color-mixer/advisor.js'
import { resultKey, useMixStore } from '../../../features/color-mixer/mixStore.js'
import { describeQuality, PRECISION } from '../../../features/color-mixer/solver.js'
import styles from './MixResult.module.css'

const PRECISIONS = [
  { id: 'simple', label: 'Simple', parts: PRECISION.simple },
  { id: 'normal', label: 'Normal', parts: PRECISION.normal },
  { id: 'preciso', label: 'Preciso', parts: PRECISION.preciso },
]

const sameRecipe = (a, b) =>
  a.parts.length === b.parts.length && a.parts.every((p, i) => p.paintId === b.parts[i].paintId && p.parts === b.parts[i].parts)

function RecipeView({ recipe, target }) {
  return (
    <div className={styles.recipe}>
      <ColorCompare target={target} mix={recipe.mixHex} quality={recipe.quality} deltaE={recipe.deltaE} />
      <ul className={styles.rows}>
        {recipe.parts.map((p) => (
          <RecipeRow key={p.paintId} name={p.name} hex={p.hex} parts={p.parts} total={recipe.total} />
        ))}
      </ul>
      <PixelText size="xs" tone="soft">Total: {recipe.total} {recipe.total === 1 ? 'parte' : 'partes'} en total</PixelText>
    </div>
  )
}

/**
 * Paso 3: calcula y muestra cuántas partes de cada pintura mezclar.
 * `paints` = pinturas elegidas [{ id, name, hex }]. `onAddPaint(role)` se llama al pedir sumar una pintura base.
 */
export default function MixResult({ target, paints, onAddPaint }) {
  const maxParts = useMixStore((s) => s.maxParts)
  const recipeKey = useMixStore((s) => s.recipeKey)
  const result = useMixStore((s) => s.result)
  const { calculate, setMaxParts, selectRecipe } = useMixStore.getState()

  const key = resultKey(target, paints, maxParts)
  useEffect(() => { calculate({ target, paints }) }, [key]) // eslint-disable-line -- `key` resume target, paints y maxParts

  const current = result?.key === key ? result : null // un resultado de otros datos no se muestra
  const retry = () => { useMixStore.setState({ result: null }); calculate({ target, paints }) }

  const precision = (
    <div className={styles.row} role="group" aria-label="Precisión del cálculo">
      {PRECISIONS.map(({ id, label, parts }) => (
        <PixelButton
          key={id}
          size="sm"
          variant={maxParts === parts ? 'primary' : 'secondary'}
          aria-pressed={maxParts === parts}
          onClick={() => setMaxParts(parts)}
        >
          {label}
        </PixelButton>
      ))}
    </div>
  )

  if (!current || current.status === 'mixing') {
    return (
      <div className={styles.root}>
        {precision}
        <MixingAnimation colors={paints.map((p) => p.hex)} />
      </div>
    )
  }

  if (current.status === 'error' || !current.data) {
    return (
      <div className={styles.root}>
        {precision}
        <PixelText variant="body" tone="danger" role="alert">No pudimos calcular la mezcla.</PixelText>
        <PixelButton variant="secondary" onClick={retry}>Reintentar</PixelButton>
      </div>
    )
  }

  const { recommended, best, alternatives } = current.data
  const tabs = [
    { id: 'recommended', label: 'Recomendada' },
    { id: 'best', label: 'Más exacta' },
    ...(alternatives.length > 0 ? [{ id: 'others', label: 'Otras' }] : []),
  ]
  const active = tabs.some((t) => t.id === recipeKey) ? recipeKey : 'recommended'
  const shown = active === 'best' ? best : recommended
  const problems = diagnose(target, shown)
  const suggestions = current.suggestions.slice(0, 2)

  return (
    <div className={styles.root}>
      {precision}
      <div className={styles.row} role="group" aria-label="Qué receta ver">
        {tabs.map(({ id, label }) => (
          <PixelButton
            key={id}
            size="sm"
            variant={active === id ? 'primary' : 'secondary'}
            aria-pressed={active === id}
            onClick={() => selectRecipe(id)}
          >
            {label}
          </PixelButton>
        ))}
      </div>

      {active === 'others' ? (
        alternatives.map((alt, i) => (
          <section key={i} aria-label={`Opción ${i + 1}`} className={styles.option}>
            <PixelText size="xs">Opción {i + 1}</PixelText>
            <RecipeView recipe={alt} target={target} />
          </section>
        ))
      ) : (
        <>
          {active === 'best' && sameRecipe(best, recommended) && (
            <PixelText variant="body" size="sm" tone="soft">Es la misma que la recomendada.</PixelText>
          )}
          <RecipeView recipe={shown} target={target} />
        </>
      )}

      {problems.length > 0 && (
        <PixelPanel tone="yellow" padding="sm" role="note" aria-label="Con estas pinturas no se llega del todo">
          <div className={styles.advice}>
            <PixelText size="xs">Con estas pinturas no se llega del todo</PixelText>
            <ul className={styles.list}>
              {problems.map((d) => <li key={d.code}><PixelText variant="body" size="sm">{d.message}</PixelText></li>)}
            </ul>
            {suggestions.map((s) => (
              <div key={s.role.id} className={styles.suggestion}>
                <PixelText variant="body" size="sm">
                  Con {s.role.name} quedaría {describeQuality(s.deltaE).toLowerCase()}.
                </PixelText>
                <PixelButton size="sm" variant="secondary" onClick={() => onAddPaint(s.role)}>
                  Agregar {s.role.name}
                </PixelButton>
              </div>
            ))}
          </div>
        </PixelPanel>
      )}

      <PixelText variant="body" size="sm" tone="soft">
        Es una aproximación: probá con una cantidad chica antes de mezclar todo.
      </PixelText>
    </div>
  )
}
