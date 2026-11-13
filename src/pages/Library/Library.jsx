import { useEffect } from 'react'
import { RecipeLibrary } from '../../components/organisms/index.js'
import { AppShell } from '../../components/templates/index.js'
import { ROUTES, navigate } from '../../features/navigation/useRoute.js'
import { useRecipesStore } from '../../features/recipes/recipesStore.js'

/** Pestaña "Recetas": la biblioteca. */
export default function Library() {
  const { recipes, status, error } = useRecipesStore()
  const { load, rename, remove } = useRecipesStore.getState()

  useEffect(() => {
    if (useRecipesStore.getState().status === 'idle') useRecipesStore.getState().load()
  }, [])

  return (
    <AppShell title="Mis recetas" activeTab="library">
      <RecipeLibrary
        recipes={recipes}
        status={status}
        error={error}
        onOpen={(id) => navigate(ROUTES.recipe(id))}
        onRename={rename}
        onRemove={remove}
        onRetry={load}
        onCreate={() => navigate(ROUTES.create)}
      />
    </AppShell>
  )
}
