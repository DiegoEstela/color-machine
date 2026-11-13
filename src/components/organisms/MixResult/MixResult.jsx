import { useEffect } from 'react'
import { PixelButton, PixelIcon, PixelPanel, PixelText } from '../../atoms/index.js'
import { ColorCompare, MixingAnimation, OptionGroup, RecipeRow } from '../../molecules/index.js'
import { diagnose } from '../../../features/color-mixer/advisor.js'
import { resultKey, useMixStore } from '../../../features/color-mixer/mixStore.js'
import { describeQuality, PRECISION } from '../../../features/color-mixer/solver.js'
import styles from './MixResult.module.css'

const PRECISIONS = [
  {
    id: 'simple', label: 'Simple', hint: 'hasta 6 partes', parts: PRECISION.simple,
    description: 'Recetas cortas y fáciles de medir, aunque el color puede variar un poco.',
  },
  {
    id: 'normal', label: 'Normal', hint: 'hasta 10 partes', parts: PRECISION.normal,
    description: 'Equilibrio entre facilidad de medir y parecido con tu color.',
  },
  {
    id: 'preciso', label: 'Preciso', hint: 'hasta 16 partes', parts: PRECISION.preciso,
    description: 'El color más parecido posible, pero con más partes para medir.',
  },
]

const RECIPE_OPTIONS = [
  { id: 'recommended', label: 'Recomendada', hint: 'la más simple', description: 'La más simple que queda casi igual de cerca que la mejor.' },
  { id: 'best', label: 'Más exacta', hint: 'la que más se parece', description: 'La que más se acerca a tu color, aunque lleve más partes.' },
  { id: 'others', label: 'Otras', hint: 'variantes', description: 'Recetas distintas con un parecido similar, por si te falta alguna pintura.' },
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

  const precisionId = (PRECISIONS.find((p) => p.parts === maxParts) ?? PRECISIONS[1]).id
  const precision = (
    <OptionGroup
      label="¿Qué tan exacta querés la receta?"
      options={PRECISIONS}
      columns={3}
      value={precisionId}
      onChange={(id) => setMaxParts(PRECISIONS.find((p) => p.id === id).parts)}
    />
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
  const options = alternatives.length > 0 ? RECIPE_OPTIONS : RECIPE_OPTIONS.filter((o) => o.id !== 'others')
  const active = options.some((o) => o.id === recipeKey) ? recipeKey : 'recommended'
  const shown = active === 'best' ? best : recommended
  const problems = diagnose(target, shown)
  const suggestions = current.suggestions.slice(0, 2)

  return (
    <div className={styles.root}>
      {precision}
      <OptionGroup label="¿Qué receta querés ver?" options={options} columns={2} value={active} onChange={selectRecipe} />

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

      <PixelPanel tone="sky" padding="sm" role="note" aria-label="Qué es una parte">
        <div className={styles.info}>
          <PixelIcon name="info" size={20} />
          <PixelText variant="body" size="sm">
            1 parte = la medida que quieras (una cucharada, una tapita). Usá la misma para todas las pinturas.
          </PixelText>
        </div>
      </PixelPanel>

      {problems.length > 0 && (
        <PixelPanel tone="yellow" padding="sm" role="note" aria-label="Con estas pinturas no se llega del todo" title="Con estas pinturas no se llega del todo">
          <div className={styles.advice}>
            <ul className={styles.list}>
              {problems.map((d) => <li key={d.code}><PixelText variant="body" size="sm">{d.message}</PixelText></li>)}
            </ul>
            {suggestions.map((s) => (
              <div key={s.role.id} className={styles.suggestion}>
                <PixelText variant="body" size="sm">
                  Con {s.role.name} quedaría {describeQuality(s.deltaE).toLowerCase()}.
                </PixelText>
                <PixelButton size="sm" variant="secondary" icon="jar" onClick={() => onAddPaint(s.role)}>
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
