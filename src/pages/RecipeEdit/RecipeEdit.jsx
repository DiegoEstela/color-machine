import { useEffect } from 'react'
import { PixelButton, PixelPanel, PixelText } from '../../components/atoms/index.js'
import { RecipeEditor } from '../../components/organisms/index.js'
import { AppShell } from '../../components/templates/index.js'
import { ROUTES, navigate } from '../../features/navigation/useRoute.js'
import { usePaintsStore } from '../../features/paints/paintsStore.js'
import { useRecipesStore } from '../../features/recipes/recipesStore.js'

/**
 * Edición de una receta guardada (`#/recetas/<id>/editar`). Funciona abierta directo: carga recetas y pinturas si hace falta.
 * Guardar cambios sobrescribe la receta; guardar como copia crea una nueva y deja la original igual.
 */
export default function RecipeEdit({ id }) {
  const { recipes, status, error } = useRecipesStore()
  const paints = usePaintsStore((s) => s.paints)
  const recipe = recipes.find((r) => r.id === id)

  useEffect(() => {
    if (useRecipesStore.getState().status === 'idle') useRecipesStore.getState().load()
    if (usePaintsStore.getState().status === 'idle') usePaintsStore.getState().load()
  }, [])

  const handleSave = async (payload) => {
    const result = await useRecipesStore.getState().updateMix(id, payload)
    return result.error ? { error: result.error } : { href: ROUTES.recipe(id) }
  }
  const handleSaveCopy = async (name, payload) => {
    const result = await useRecipesStore.getState().add({ name, target_hex: recipe.target_hex, ...payload })
    return result.error ? { error: result.error } : { href: ROUTES.recipe(result.data.id) }
  }

  let body
  if (status === 'idle' || status === 'loading') {
    body = <PixelText variant="body" tone="soft" role="status">Cargando la receta...</PixelText>
  } else if (status === 'error') {
    body = (
      <div>
        <PixelText variant="body" tone="danger" role="alert">{error}</PixelText>
        <PixelButton variant="secondary" onClick={() => useRecipesStore.getState().load()}>Reintentar</PixelButton>
      </div>
    )
  } else if (!recipe) {
    body = (
      <PixelPanel tone="yellow" padding="md" role="alert">
        <PixelText variant="body">No encontramos esta receta. Puede que la hayas borrado.</PixelText>
        <PixelButton icon="book" onClick={() => navigate(ROUTES.library)}>Ver mis recetas</PixelButton>
      </PixelPanel>
    )
  } else {
    // `key`: si se abre otra receta, el editor arranca de cero con esa.
    body = <RecipeEditor key={recipe.id} recipe={recipe} paints={paints} onSave={handleSave} onSaveCopy={handleSaveCopy} onSaved={(outcome) => outcome.href} />
  }

  return (
    <AppShell
      title="Editar mezcla"
      activeTab="library"
      back={{ href: ROUTES.recipe(id), label: 'Volver a la receta' }}
      scrollKey={id}
    >
      {body}
    </AppShell>
  )
}
