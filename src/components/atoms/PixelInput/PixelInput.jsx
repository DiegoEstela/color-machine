import { useId } from 'react'
import styles from './PixelInput.module.css'

export default function PixelInput({ label, error, id, ...rest }) {
  const autoId = useId()
  const inputId = id ?? autoId
  const errorId = `${inputId}-error`
  return (
    <div className={styles.field}>
      <label htmlFor={inputId} className={styles.label}>{label}</label>
      <input
        id={inputId}
        className={styles.input}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        {...rest}
      />
      {error && <span id={errorId} role="alert" className={styles.error}>{error}</span>}
    </div>
  )
}
