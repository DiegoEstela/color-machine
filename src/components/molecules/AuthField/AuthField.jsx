import { useState } from 'react'
import { PixelInput, PixelButton } from '../../atoms/index.js'
import styles from './AuthField.module.css'

/** Campo de formulario de acceso. Con type="password" agrega botón para ver/ocultar. */
export default function AuthField({ type = 'text', ...rest }) {
  const [visible, setVisible] = useState(false)
  if (type !== 'password') return <PixelInput type={type} {...rest} />
  return (
    <div className={styles.wrap}>
      <PixelInput type={visible ? 'text' : 'password'} {...rest} />
      <PixelButton
        variant="secondary"
        size="sm"
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? 'Ocultar' : 'Ver'}
      </PixelButton>
    </div>
  )
}
