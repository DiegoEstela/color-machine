export const MIN_PASSWORD = 8
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const validateEmail = (v = '') => (EMAIL_RE.test(v.trim()) ? null : 'Ingresá un email válido.')

export const validatePassword = (v = '') =>
  v.length >= MIN_PASSWORD ? null : `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`

/** Devuelve `{ campo: mensaje }` solo con los campos inválidos. `{}` si todo está bien. */
export function validateForm(mode, { email, password, confirm } = {}) {
  const errors = {}
  if (mode !== 'reset') {
    const e = validateEmail(email)
    if (e) errors.email = e
  }
  if (mode === 'login') {
    if (!password) errors.password = 'Ingresá tu contraseña.'
  }
  if (mode === 'signup' || mode === 'reset') {
    const p = validatePassword(password)
    if (p) errors.password = p
    else if (password !== confirm) errors.confirm = 'Las contraseñas no coinciden.'
  }
  return errors
}
