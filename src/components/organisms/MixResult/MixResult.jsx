import { useEffect, useRef, useState } from 'react'
import { PixelButton, PixelIconButton, PixelPanel, PixelText } from '../../atoms/index.js'
import { ColorCompare, InfoSheet, MixingAnimation, OptionGroup, RecipeRow, SaveRecipe } from '../../molecules/index.js'
import { diagnose } from '../../../features/color-mixer/advisor.js'
import { resultKey, useMixStore } from '../../../features/color-mixer/mixStore.js'
import { describeQuality, PRECISION } from '../../../features/color-mixer/solver.js'
import { ROUTES, navigate } from '../../../features/navigation/useRoute.js'
import { MAX_SELECTED } from '../../../features/paints/paintsStore.js'
import { useRecipesStore } from '../../../features/recipes/recipesStore.js'
import { buildRecipePayload, recipeSignature } from '../../../features/recipes/validation.js'
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

// Solo dos opciones y sin frase explicativa: así entra en una fila y la pantalla queda corta.
const RECIPE_OPTIONS = [
  { id: 'recommended', label: 'Recomendada', hint: 'la más simple' },
  { id: 'best', label: 'Más exacta', hint: 'la que más se parece' },
]

/**
 * Paso 3: calcula y muestra cuántas partes de cada pintura mezclar.
 * `paints` = pinturas elegidas [{ id, name, hex }]. A ellas se suman las pinturas estándar que el usuario agregó
 * desde acá con "+ Color". `onAddPaint(pintura)` se llama al querer reemplazar una estándar por la propia.
 */
export default function MixResult({ target, paints, onAddPaint }) {
  const maxParts = useMixStore((s) => s.maxParts)
  const recipeKey = useMixStore((s) => s.recipeKey)
  const result = useMixStore((s) => s.result)
  const savedRecipes = useMixStore((s) => s.savedRecipes)
  const extraPaints = useMixStore((s) => s.extraPaints)
  const { calculate, setMaxParts, selectRecipe, addExtra, removeExtra } = useMixStore.getState()
  const [infoOpen, setInfoOpen] = useState(false)
  const rowsRef = useRef(null)

  const allPaints = [...paints, ...extraPaints]
  const key = resultKey(target, allPaints, maxParts)
  useEffect(() => { calculate({ target, paints: allPaints }) }, [key]) // eslint-disable-line -- `key` resume target, pinturas y maxParts

  const current = result?.key === key ? result : null // un resultado de otros datos no se muestra

  // Al sumar una pintura estándar, la lista baja hasta mostrarla completa (con su etiqueta y sus acciones).
  useEffect(() => {
    if (current?.status === 'ready' && extraPaints.length > 0) {
      rowsRef.current?.scrollTo?.({ top: rowsRef.current.scrollHeight })
    }
  }, [current?.status, extraPaints.length, key]) // eslint-disable-line -- `current` cambia en cada render; `status` y `key` lo resumen
  const retry = () => { useMixStore.setState({ result: null }); calculate({ target, paints: allPaints }) }
  const atLimit = allPaints.length >= MAX_SELECTED

  // Guardar una receta: se guarda una copia (nombre, color y partes) y se recuerda para no duplicarla.
  const saveFor = (recipe) => {
    const signature = recipeSignature(target, recipe)
    return {
      saved: Boolean(savedRecipes[signature]),
      onOpenLibrary: () => navigate(ROUTES.library),
      onSave: async (name) => {
        const built = buildRecipePayload({ name, targetHex: target, recipe })
        if (built.error) return { error: built.error }
        const added = await useRecipesStore.getState().add(built.payload)
        if (added.error) return { error: added.error }
        useMixStore.getState().markSaved(signature, added.data.id)
        return {}
      },
    }
  }

  const precisionId = (PRECISIONS.find((p) => p.parts === maxParts) ?? PRECISIONS[1]).id
  const active = RECIPE_OPTIONS.some((o) => o.id === recipeKey) ? recipeKey : 'recommended'

  const groups = (
    <>
      <OptionGroup
        label="¿Qué tan exacta querés la receta?"
        options={PRECISIONS}
        columns={3}
        value={precisionId}
        onChange={(id) => setMaxParts(PRECISIONS.find((p) => p.id === id).parts)}
      />
      <OptionGroup
        label="¿Qué receta querés ver?"
        options={RECIPE_OPTIONS}
        columns={2}
        value={active}
        onChange={selectRecipe}
        labelAction={<PixelIconButton icon="info" size="sm" hitBias="up" label="Cómo leer tu receta" onClick={() => setInfoOpen(true)} />}
      />
    </>
  )

  const sheet = (
    <InfoSheet open={infoOpen} onClose={() => setInfoOpen(false)} title="Cómo leer tu receta">
      <PixelText variant="body">1 parte = la medida que quieras (una cucharada, una tapita). Usá la misma para todas las pinturas.</PixelText>
      <PixelText variant="body">Es una aproximación: probá con una cantidad chica antes de mezclar todo.</PixelText>
      <PixelText variant="body">
        Las pinturas «estándar» (las que sumás con «+ Blanco», «+ Negro»…) usan un color típico de caja de témperas.
        Si la tuya es distinta, el resultado puede variar: tocá «Usar la mía» para reemplazarla.
      </PixelText>
    </InfoSheet>
  )

  // La zona del resultado tiene siempre el mismo alto, mientras mezcla y cuando muestra la receta.
  if (!current || current.status === 'mixing') {
    return (
      <div className={styles.root}>
        {groups}
        <div className={styles.zone}><MixingAnimation colors={allPaints.map((p) => p.hex)} /></div>
        {sheet}
      </div>
    )
  }

  if (current.status === 'error' || !current.data) {
    return (
      <div className={styles.root}>
        {groups}
        <div className={styles.zone} data-state="error">
          <PixelText variant="body" tone="danger" role="alert">No pudimos calcular la mezcla.</PixelText>
          <PixelButton variant="secondary" onClick={retry}>Reintentar</PixelButton>
        </div>
        {sheet}
      </div>
    )
  }

  const { recommended, best } = current.data
  const shown = active === 'best' ? best : recommended
  const problems = diagnose(target, shown)
  const suggestions = current.suggestions.slice(0, 2)
  const extraById = new Map(extraPaints.map((p) => [p.id, p]))

  return (
    <div className={styles.root}>
      {groups}

      <div className={styles.zone}>
        <ColorCompare compact target={target} mix={shown.mixHex} quality={shown.quality} deltaE={shown.deltaE} />
        <ul ref={rowsRef} className={styles.rows} data-has-standard={extraPaints.length > 0 || undefined}>
          {shown.parts.map((p) => {
            const extra = extraById.get(p.paintId)
            return (
              <RecipeRow
                key={p.paintId}
                name={p.name}
                hex={p.hex}
                parts={p.parts}
                total={shown.total}
                standard={Boolean(extra)}
                onRemove={() => removeExtra(p.paintId)}
                onUseMine={() => { removeExtra(p.paintId); onAddPaint(extra) }}
              />
            )
          })}
        </ul>
      </div>

      {problems.length > 0 && (
        <PixelPanel tone="yellow" padding="xs" role="note" aria-label="Con estas pinturas no se llega del todo">
          <div className={styles.advice}>
            <PixelText variant="body" size="sm">{problems.map((d) => d.message).join(' ')}</PixelText>
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
                    onClick={() => addExtra(s.role)}
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
              <PixelText variant="body" size="sm" tone="soft" role="status">
                Ya usás {MAX_SELECTED} pinturas, el máximo por mezcla. Quitá una para sumar otra.
              </PixelText>
            )}
          </div>
        </PixelPanel>
      )}

      <SaveRecipe {...saveProps(saveFor(shown))} />
      {sheet}
    </div>
  )
}

// SaveRecipe recibe los nombres de props de su propia API.
const saveProps = ({ saved, onSave, onOpenLibrary }) => ({ saved, onSave, onOpenLibrary })
