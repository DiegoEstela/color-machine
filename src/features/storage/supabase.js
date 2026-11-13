import { createClient } from '@supabase/supabase-js'
import { isNetworkError, offlineError } from './errors.js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// null si faltan las variables: la app sigue funcionando sin guardar en la nube.
export const supabase = url && anonKey ? createClient(url, anonKey) : null

/** Usuario de la sesión actual, o un error claro. Siempre devuelve `{ user, error }`. */
export async function requireUser() {
  if (!supabase) {
    return { user: null, error: { code: 'not_configured', message: 'Supabase no está configurado.' } }
  }
  const { data, error } = await supabase.auth.getSession()
  if (error) {
    return { user: null, error: isNetworkError(error) ? offlineError() : { code: 'auth_error', message: error.message } }
  }
  const user = data.session?.user ?? null
  if (!user) {
    return { user: null, error: { code: 'not_signed_in', message: 'Necesitás iniciar sesión.' } }
  }
  return { user, error: null }
}
