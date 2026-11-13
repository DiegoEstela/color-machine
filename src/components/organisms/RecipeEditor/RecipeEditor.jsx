import { useEffect, useReducer, useState } from 'react'
import { PixelButton, PixelPanel, PixelText } from '../../atoms/index.js'
import { ColorCompare, EditableRecipeRow, InfoSheet, PaintPicker, RecipeNameForm } from '../../molecules/index.js'
import { planAsync } from '../../../features/color-mixer/solverClient.js'
import {
  EDITOR_MAX_PAINTS, buildEditPayload, canAddPaint, compareToSaved, copyName, draftResult, editorReducer, initEditor, isDirty,
} from '../../../features/recipes/editor.js'
import { useLeaveGuard } from '../../../hooks/useLeaveGuard.js'
import styles from './RecipeEditor.module.css'

const TREND = {
  better: { tone: 'mint', text: 'Mejoró: está más cerca de tu color.' },
  same: { tone: 'sky', text: 'Queda igual de parecida.' },
  worse: { tone: 'yellow', text: 'Se alejó de tu color. Podés deshacer.' },
}

/**
 * Editor de una receta guardada: retocá partes, sumá colores o usá "Más claro / Más oscuro" y mirá en vivo si se acerca
 * al color buscado. `onSave(payload)` y `onSaveCopy(name, payload)` devuelven `{ error? }`; `onSaved(href)` / `onCopied(href)`
 * llevan a otra pantalla al terminar. `paints` = Mis pinturas. El color buscado (`target_hex`) no se modifica.
 */
export default function RecipeEditor({ recipe, paints, onSave, onSaveCopy, onSaved }) {
  const [state, dispatch] = useReducer(editorReducer, recipe.mix, initEditor)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [plan, setPlan] = useState(null) // consejo completo; `null` también si la receta ya alcanza (no hace falta sumar nada)
  const [planReady, setPlanReady] = useState(false) // ya terminó de calcularse (haya o no consejo)
  const [copying, setCopying] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const { draft, saved, history } = state
  const dirty = isDirty(saved, draft)
  const guard = useLeaveGuard(dirty)
  const result = draftResult(draft)
  const total = draft.reduce((sum, p) => sum + p.parts, 0)
  // "Antes" se recalcula con la mezcla guardada (no con `result_hex`): así, al abrir, antes y ahora siempre coinciden.
  const cmp = compareToSaved({ target: recipe.target_hex, savedResult: draftResult(saved), draftResult: result })
  const trend = TREND[cmp.trend]

  // Al abrir el selector se calcula qué conviene sumar (consejo completo) con las pinturas de la receta como base.
  useEffect(() => {
    if (!pickerOpen) return undefined
    let live = true
    const available = draft.map((p, i) => ({ id: `draft-${i}`, name: p.name, hex: p.hex }))
    planAsync(recipe.target_hex, available, 10)
      .then((p) => { if (live) { setPlan(p); setPlanReady(true) } })
      .catch(() => { if (live) setPlanReady(true) })
    return () => { live = false }
  }, [pickerOpen]) // eslint-disable-line -- se calcula al abrir, con la receta de ese momento

  const closePicker = () => { setPickerOpen(false); setPlan(null); setPlanReady(false) }
  const planLoading = pickerOpen && !planReady

  async function save(action) {
    const built = buildEditPayload(draft)
    if (built.error) return setError(built.error)
    setBusy(true)
    setError(null)
    const outcome = await action(built.payload)
    setBusy(false)
    if (outcome?.error) return setError(outcome.error)
    dispatch({ type: 'saved' }) // lo guardado pasa a ser el borrador: ya no hay cambios sin guardar
    return outcome
  }

  const handleSave = async () => {
    const outcome = await save(onSave)
    if (outcome && !outcome.error) guard.leaveTo(onSaved(outcome))
  }

  const handleCopy = async (name) => {
    const outcome = await save((payload) => onSaveCopy(name, payload))
    if (outcome && !outcome.error) { setCopying(false); guard.leaveTo(onSaved(outcome)) }
    return outcome ?? { error }
  }

  return (
    <div className={styles.root}>
      <ColorCompare compact target={recipe.target_hex} mix={result} quality={cmp.afterQuality} deltaE={cmp.after} />

      <PixelPanel tone={trend.tone} padding="xs" role="status" aria-label="Cómo va comparada con lo guardado">
        <div className={styles.trend}>
          <PixelText variant="body" size="sm">Antes: {cmp.beforeQuality} · Ahora: {cmp.afterQuality}</PixelText>
          {dirty && <PixelText variant="body" size="sm">{trend.text}</PixelText>}
        </div>
      </PixelPanel>

      <div className={styles.shortcuts}>
        <PixelButton size="sm" variant="secondary" icon="plus" disabled={busy} onClick={() => dispatch({ type: 'lighten' })}>Más claro</PixelButton>
        <PixelButton size="sm" variant="secondary" icon="plus" disabled={busy} onClick={() => dispatch({ type: 'darken' })}>Más oscuro</PixelButton>
      </div>
      <PixelText size="xs" tone="soft">Más claro suma 1 parte de blanco; más oscuro, 1 de negro.</PixelText>

      <ul className={styles.rows}>
        {draft.map((p, i) => (
          <EditableRecipeRow
            key={`${p.name}-${p.hex}`}
            name={p.name}
            hex={p.hex}
            parts={p.parts}
            total={total}
            canRemove={draft.length > 1}
            onChangeParts={(delta) => dispatch({ type: 'bump', index: i, delta })}
            onRemove={() => dispatch({ type: 'remove', index: i })}
          />
        ))}
      </ul>

      <PixelButton variant="secondary" icon="plus" disabled={busy} onClick={() => setPickerOpen(true)}>Sumar otro color</PixelButton>
      {draft.length >= EDITOR_MAX_PAINTS && (
        <PixelText size="xs" tone="soft" role="status">Hay {EDITOR_MAX_PAINTS} pinturas distintas, el máximo. Quitá una para sumar otra.</PixelText>
      )}

      <div className={styles.row}>
        <PixelButton size="sm" variant="secondary" disabled={busy || history.length === 0} onClick={() => dispatch({ type: 'undo' })}>Deshacer</PixelButton>
        <PixelButton size="sm" variant="secondary" disabled={busy || !dirty} onClick={() => dispatch({ type: 'reset' })}>Restablecer</PixelButton>
      </div>

      {error && <PixelText variant="body" tone="danger" role="alert">{error}</PixelText>}

      {copying ? (
        <RecipeNameForm
          initialName={copyName(recipe.name)}
          submitLabel="Guardar copia"
          onCancel={() => setCopying(false)}
          onSubmit={handleCopy}
        />
      ) : (
        <div className={styles.save}>
          <PixelButton size="lg" icon="save" disabled={!dirty || busy} onClick={handleSave}>{busy ? 'Guardando...' : 'Guardar cambios'}</PixelButton>
          <PixelButton variant="secondary" disabled={!dirty || busy} onClick={() => { setError(null); setCopying(true) }}>Guardar como copia</PixelButton>
        </div>
      )}

      <PaintPicker
        open={pickerOpen}
        onClose={closePicker}
        paints={paints}
        plan={plan}
        planLoading={planLoading}
        canAdd={(paint) => canAddPaint(draft, paint)}
        onPick={(paint) => dispatch({ type: 'add', paint })}
      />

      <InfoSheet open={guard.pending !== null} onClose={guard.stay} title="¿Descartar los cambios?" closeLabel="Seguir editando">
        <PixelText variant="body">Hiciste cambios en la mezcla que todavía no guardaste. Si salís ahora, se pierden.</PixelText>
        <PixelButton variant="danger" onClick={guard.leave}>Descartar cambios</PixelButton>
      </InfoSheet>
    </div>
  )
}
