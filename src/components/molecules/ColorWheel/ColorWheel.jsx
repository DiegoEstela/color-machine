import { useEffect, useRef, useState } from 'react'
import { hexToHsl, hslToHex, hslToRgb255, hslToWheelPoint, wheelPointToHsl } from '../../../lib/color.js'
import styles from './ColorWheel.module.css'

const GRID = 48 // celdas por lado: baja resolución escalada = look pixel art
const RADIUS = GRID / 2
const DEFAULT_HSL = { h: 340, s: 70, l: 75 }

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

function drawWheel(canvas, lightness) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const img = ctx.createImageData(GRID, GRID)
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const hsl = wheelPointToHsl(x + 0.5 - RADIUS, y + 0.5 - RADIUS, RADIUS, lightness)
      if (!hsl) continue
      const [r, g, b] = hslToRgb255(hsl)
      img.data.set([r, g, b, 255], (y * GRID + x) * 4)
    }
  }
  ctx.putImageData(img, 0, 0)
}

const FINE = [
  { key: 'h', label: 'Matiz', max: 360 },
  { key: 's', label: 'Saturación', max: 100 },
]

/**
 * Rueda de color (matiz = ángulo, saturación = radio) con control de claridad y un plegable "Ajuste fino"
 * (matiz y saturación, también para teclado). `value` puede ser null. `aside` se muestra al costado de la rueda.
 */
export default function ColorWheel({ value, onChange, aside }) {
  const canvasRef = useRef(null)
  const [hsl, setHsl] = useState(() => (value ? hexToHsl(value) : DEFAULT_HSL))

  // Si el valor cambia desde afuera (hex, foto), sincroniza sin perder el matiz de los grises.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    if (value && value !== hslToHex(hsl)) setHsl(hexToHsl(value))
  }

  useEffect(() => {
    if (canvasRef.current) drawWheel(canvasRef.current, hsl.l)
  }, [hsl.l])

  const update = (next) => {
    setHsl(next)
    onChange(hslToHex(next))
  }

  const pick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const gx = clamp(((e.clientX - rect.left) / rect.width) * GRID, 0, GRID - 0.001)
    const gy = clamp(((e.clientY - rect.top) / rect.height) * GRID, 0, GRID - 0.001)
    // Ajusta al centro de la celda y mantiene el punto dentro del círculo.
    let x = Math.floor(gx) + 0.5 - RADIUS
    let y = Math.floor(gy) + 0.5 - RADIUS
    const dist = Math.hypot(x, y)
    if (dist > RADIUS) { x = (x / dist) * RADIUS; y = (y / dist) * RADIUS }
    const next = wheelPointToHsl(x, y, RADIUS, hsl.l)
    if (next) update(next)
  }

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId)
    pick(e)
  }
  const onPointerMove = (e) => {
    if (e.buttons) pick(e)
  }

  const marker = hslToWheelPoint(hsl, RADIUS)

  return (
    <div className={styles.root} role="group" aria-label="Rueda de color">
      <div
        className={styles.wheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        data-testid="color-wheel"
      >
        <canvas ref={canvasRef} width={GRID} height={GRID} className={styles.canvas} aria-hidden="true" />
        <span
          className={styles.marker}
          style={{
            left: `${50 + (marker.x / GRID) * 100}%`,
            top: `${50 + (marker.y / GRID) * 100}%`,
            '--marker-color': value ?? hslToHex(hsl),
          }}
        />
      </div>

      {aside && <div className={styles.aside}>{aside}</div>}

      <label className={`${styles.slider} ${styles.light}`}>
        <span className={styles.label}>Claridad</span>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={Math.round(hsl.l)}
          onChange={(e) => update({ ...hsl, l: Number(e.target.value) })}
        />
      </label>

      <details className={styles.fine}>
        <summary className={styles.summary}>Ajuste fino</summary>
        {FINE.map(({ key, label, max }) => (
          <label key={key} className={styles.slider}>
            <span className={styles.label}>{label}</span>
            <input
              type="range"
              min={0}
              max={max}
              step={1}
              value={Math.round(hsl[key])}
              onChange={(e) => update({ ...hsl, [key]: Number(e.target.value) })}
            />
          </label>
        ))}
      </details>
    </div>
  )
}
