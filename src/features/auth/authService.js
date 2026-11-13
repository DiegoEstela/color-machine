import { isNetworkError, offlineError } from '../storage/errors.js'
import { supabase } from '../storage/supabase.js'

const MESSAGES = {
  invalid_credentials: 'Email o contraseña incorrectos.',
  email_not_confirmed: 'Todavía no confirmaste tu email. Revisá tu correo.',
  user_already_exists: 'Ese email ya está registrado.',
  weak_password: 'La contraseña es demasiado débil.',
  same_password: 'La nueva contraseña debe ser distinta a la anterior.',
  over_email_send_rate_limit: 'Se enviaron demasiados correos. Probá de nuevo en unos minutos.',
  over_request_rate_limit: 'Demasiados intentos. Probá de nuevo en unos minutos.',
  not_configured: 'La app no está conectada a Supabase.',
}

export function toAuthError(error) {
  if (!error) return null
  if (isNetworkError(error)) return offlineError()
  const code = error.code ?? 'auth_error'
  return { code, message: MESSAGES[code] ?? 'No pudimos completar la acción. Probá de nuevo.' }
}

const notConfigured = () => ({ data: null, error: toAuthError({ code: 'not_configured' }) })
const redirectUrl = () => window.location.origin

async function call(fn) {
  if (!supabase) return notConfigured()
  const { data, error } = await fn(supabase.auth)
  return { data: error ? null : data, error: toAuthError(error) }
}

/** Con "Confirm email" activo, `needsConfirmation` es true y no hay sesión todavía. */
export async function signUp(email, password) {
  const res = await call((auth) =>
    auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: redirectUrl() } }),
  )
  if (res.error) return res
  // Supabase devuelve un usuario sin identidades cuando el email ya existe.
  if (res.data.user?.identities?.length === 0) {
    return { data: null, error: toAuthError({ code: 'user_already_exists' }) }
  }
  return { data: { needsConfirmation: !res.data.session }, error: null }
}

export const signIn = (email, password) =>
  call((auth) => auth.signInWithPassword({ email: email.trim(), password }))

export const signOut = () => call((auth) => auth.signOut())

export const resetPassword = (email) =>
  call((auth) => auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectUrl() }))

export const updatePassword = (password) => call((auth) => auth.updateUser({ password }))

/** Suscribe a cambios de sesión. Devuelve la función para cancelar. */
export function onAuthChange(callback) {
  if (!supabase) return () => {}
  const { data } = supabase.auth.onAuthStateChange(callback)
  return () => data.subscription.unsubscribe()
}
