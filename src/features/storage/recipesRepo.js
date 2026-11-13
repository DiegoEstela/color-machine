import { createRepo } from './createRepo.js'

/** Recetas guardadas: { id, name, target_hex, result_hex, mix, created_at } */
export const recipesRepo = createRepo('recipes')
