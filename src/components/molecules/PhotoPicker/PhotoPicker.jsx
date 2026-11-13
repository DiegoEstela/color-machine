import { useRef } from 'react'
import { PixelButton, PixelIcon } from '../../atoms/index.js'
import styles from './PhotoPicker.module.css'

/** Botones "Cámara" (abre la cámara del móvil) y "Galería". Entrega el archivo elegido. */
export default function PhotoPicker({ onFile }) {
  const cameraRef = useRef(null)
  const galleryRef = useRef(null)

  const handle = (e) => {
    const file = e.target.files?.[0]
    e.target.value = '' // permite elegir de nuevo la misma foto
    if (file) onFile(file)
  }

  return (
    <div className={styles.row}>
      <PixelButton variant="secondary" onClick={() => cameraRef.current.click()}>
        <PixelIcon name="camera" /> Cámara
      </PixelButton>
      <PixelButton variant="secondary" onClick={() => galleryRef.current.click()}>
        <PixelIcon name="image" /> Galería
      </PixelButton>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handle} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={handle} />
    </div>
  )
}
