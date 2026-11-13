import { useState } from 'react'
import { PixelButton, PixelText } from '../../atoms/index.js'
import { AuthField } from '../../molecules/index.js'
import { AUTH_TITLES } from '../../../features/auth/titles.js'
import { validateForm } from '../../../features/auth/validation.js'
import styles from './AuthForm.module.css'

const SUBMIT = {
  login: 'Entrar',
  signup: 'Registrarme',
  forgot: 'Enviar correo',
  reset: 'Guardar contraseña',
}

/**
 * Formulario de acceso. `mode` y `onModeChange` son controlados por el padre.
 * `onSubmit(mode, values)` debe devolver `{ error?: string, notice?: string }`.
 */
export default function AuthForm({ mode, onModeChange, onSubmit, hideTitle = false }) {
  const [values, setValues] = useState({ email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState({})
  const [busy, setBusy] = useState(false)

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }))

  const go = (next) => {
    setErrors({})
    setFeedback({})
    onModeChange(next)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const found = validateForm(mode, values)
    setErrors(found)
    setFeedback({})
    if (Object.keys(found).length > 0) return
    setBusy(true)
    const result = await onSubmit(mode, values)
    setBusy(false)
    setFeedback(result ?? {})
  }

  const showEmail = mode !== 'reset'
  const showPassword = mode !== 'forgot'
  const showConfirm = mode === 'signup' || mode === 'reset'

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <PixelText as="h2" size="md" className={hideTitle ? styles.hidden : undefined}>{AUTH_TITLES[mode]}</PixelText>

      {showEmail && (
        <AuthField
          label="Email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
        />
      )}
      {showPassword && (
        <AuthField
          label={mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'}
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={values.password}
          onChange={set('password')}
          error={errors.password}
        />
      )}
      {showConfirm && (
        <AuthField
          label="Repetir contraseña"
          type="password"
          autoComplete="new-password"
          value={values.confirm}
          onChange={set('confirm')}
          error={errors.confirm}
        />
      )}

      {feedback.error && <PixelText variant="body" tone="danger" role="alert">{feedback.error}</PixelText>}
      {feedback.notice && <PixelText variant="body" role="status">{feedback.notice}</PixelText>}

      <PixelButton type="submit" size="lg" disabled={busy}>
        {busy ? 'Un momento...' : SUBMIT[mode]}
      </PixelButton>

      {mode === 'login' && (
        <div className={styles.links}>
          <PixelButton variant="secondary" size="sm" onClick={() => go('signup')}>Crear cuenta</PixelButton>
          <PixelButton variant="secondary" size="sm" onClick={() => go('forgot')}>Olvidé mi contraseña</PixelButton>
        </div>
      )}
      {(mode === 'signup' || mode === 'forgot') && (
        <div className={styles.links}>
          <PixelButton variant="secondary" size="sm" onClick={() => go('login')}>Ya tengo cuenta</PixelButton>
        </div>
      )}
    </form>
  )
}
