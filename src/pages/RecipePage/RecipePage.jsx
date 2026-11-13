import { useEffect } from 'react'
import { PixelButton, PixelPanel, PixelText } from '../../components/atoms/index.js'
import { RecipeDetail } from '../../components/organisms/index.js'
import { AppShell } from '../../components/templates/index.js'
import { useMixStore } from '../../features/color-mixer/mixStore.js'
import { ROUTES, navigate } from '../../features/navigation/useRoute.js'
import { useRecipesStore } from '../../features/recipes/recipesStore.js'

/** Detalle de una receta (`#/recetas/<id>`). Funciona abierto directo: carga las recetas si hace falta. */
export default function RecipePage({ id }) {
  const { recipes, status, error } = useRecipesStore()
  const { load, rename, remove } = useRecipesStore.getState()
  const recipe = recipes.find((r) => r.id === id)

  useEffect(() => {
    if (useRecipesStore.getState().status === 'idle') useRecipesStore.getState().load()
  }, [])

  const handleRemove = async (recipeId) => {
    const result = await remove(recipeId)
    if (!result.error) navigate(ROUTES.library) // la receta ya no existe: se vuelve a la lista
    return result
  }
  const handleRemix = (r) => {
    useMixStore.getState().remix(r.target_hex)
    navigate(ROUTES.create)
  }

  let body
  if (status === 'idle' || status === 'loading') {
    body = <PixelText variant="body" tone="soft" role="status">Cargando la receta...</PixelText>
  } else if (status === 'error') {
    body = (
      <div>
        <PixelText variant="body" tone="danger" role="alert">{error}</PixelText>
        <PixelButton variant="secondary" onClick={load}>Reintentar</PixelButton>
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
    body = <RecipeDetail recipe={recipe} onRename={rename} onRemove={handleRemove} onRemix={handleRemix} />
  }

  return (
    <AppShell
      title={recipe?.name ?? 'Receta'}
      activeTab="library"
      back={{ href: ROUTES.library, label: 'Volver a mis recetas' }}
      scrollKey={id}
    >
      {body}
    </AppShell>
  )
}
