import { supabase, requireUser } from './supabase.js'

const toError = (error) => (error ? { code: error.code ?? 'db_error', message: error.message } : null)

// owner_id lo fija la base (auth.uid()); nunca se acepta desde el cliente.
const clean = ({ id: _id, owner_id: _owner, created_at: _created, ...values }) => values

/** CRUD mínimo para una tabla con owner_id. Devuelve siempre `{ data, error }`. */
export function createRepo(table) {
  const run = async (query) => {
    const { error: authError } = await requireUser()
    if (authError) return { data: null, error: authError }
    const { data, error } = await query(supabase.from(table))
    return { data: error ? null : data, error: toError(error) }
  }

  return {
    list: () => run((t) => t.select('*').order('created_at', { ascending: false })),
    create: (values) => run((t) => t.insert(clean(values)).select().single()),
    update: (id, values) => run((t) => t.update(clean(values)).eq('id', id).select().single()),
    remove: (id) => run((t) => t.delete().eq('id', id)),
  }
}
