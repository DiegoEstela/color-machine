import { useState } from 'react'
import { PixelPanel, PixelText } from '../../components/atoms/index.js'
import { AuthForm } from '../../components/organisms/index.js'
import { authService, useAuthStore } from '../../features/auth/index.js'
import styles from './Auth.module.css'

export default function Auth() {
  const recovering = useAuthStore((s) => s.recovering)
  const finishRecovery = useAuthStore((s) => s.finishRecovery)
  const [mode, setMode] = useState('login')
  const activeMode = recovering ? 'reset' : mode

  async function onSubmit(currentMode, { email, password }) {
    if (currentMode === 'login') {
      const { error } = await authService.signIn(email, password)
      return error ? { error: error.message } : {}
    }
    if (currentMode === 'signup') {
      const { data, error } = await authService.signUp(email, password)
      if (error) return { error: error.message }
      return data.needsConfirmation
        ? { notice: 'Listo. Te enviamos un correo: confirmá tu email para entrar.' }
        : {}
    }
    if (currentMode === 'forgot') {
      const { error } = await authService.resetPassword(email)
      return error
        ? { error: error.message }
        : { notice: 'Si el email existe, te enviamos un enlace para cambiar la contraseña.' }
    }
    const { error } = await authService.updatePassword(password)
    if (error) return { error: error.message }
    finishRecovery()
    return {}
  }

  return (
    <main className={styles.page}>
      <PixelText as="h1" size="lg">Color Machine</PixelText>
      <PixelPanel padding="lg">
        <AuthForm key={activeMode} mode={activeMode} onModeChange={setMode} onSubmit={onSubmit} />
      </PixelPanel>
    </main>
  )
}
