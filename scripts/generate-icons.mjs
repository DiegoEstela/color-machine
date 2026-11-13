// Genera los íconos de la app (PNG) a partir del logo pixel, usando Chrome sin interfaz.
// Uso: node scripts/generate-icons.mjs   (macOS; en otro sistema: CHROME_PATH=/ruta/a/chrome)
// No requiere dependencias: Chrome dibuja cada ícono en un <canvas> y lo devuelve por el protocolo de depuración.
import { spawn } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { LOGO_GRID } from '../src/components/atoms/PixelLogo/grid.js'

const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

// Colores del logo (los mismos tokens de src/styles/tokens.css) y fondo lavanda de la barra superior.
const COLORS = { k: '#3b3650', p: '#ffc8dd', w: '#ffffff', b: '#bde0fe', y: '#fdf0a6', m: '#b9fbc0' }
const BACKGROUND = '#cdb4db'

// `cells` = lado del lienzo medido en celdas del logo (16). Más celdas = más margen alrededor.
// Los íconos "maskable" necesitan margen extra: Android los recorta en círculo o cuadrado redondeado.
const ICONS = [
  { file: 'icon-192.png', size: 192, cells: 24 },
  { file: 'icon-512.png', size: 512, cells: 24 },
  { file: 'icon-maskable-512.png', size: 512, cells: 32 },
  { file: 'apple-touch-icon.png', size: 180, cells: 24 },
  { file: 'favicon-32.png', size: 32, cells: 20 },
]

const drawIcon = ({ size, cells, grid, colors, background }) => {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = false
  ctx.fillStyle = background
  ctx.fillRect(0, 0, size, size)
  const scale = size / cells
  const offset = (cells - grid.length) / 2
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x]
      if (c === '.') continue
      ctx.fillStyle = colors[c]
      // los bordes se redondean a píxeles enteros para que no queden huecos entre celdas
      const x0 = Math.round((x + offset) * scale)
      const y0 = Math.round((y + offset) * scale)
      const x1 = Math.round((x + 1 + offset) * scale)
      const y1 = Math.round((y + 1 + offset) * scale)
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0)
    }
  })
  return canvas.toDataURL('image/png')
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const port = 9600 + Math.floor(Math.random() * 300)
const profile = mkdtempSync(join(tmpdir(), 'icons-'))
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' })

try {
  let page
  for (let i = 0; i < 40 && !page; i++) {
    try { page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page') } catch { /* Chrome todavía arranca */ }
    if (!page) await sleep(250)
  }
  if (!page) throw new Error('No se pudo conectar con Chrome. ¿Está instalado? Usá CHROME_PATH para indicar su ruta.')
  const ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve) => { ws.onopen = resolve })
  let id = 0
  const pending = new Map()
  ws.onmessage = (m) => { const d = JSON.parse(m.data); pending.get(d.id)?.(d); pending.delete(d.id) }
  const send = (method, params = {}) => new Promise((resolve) => { const i = ++id; pending.set(i, resolve); ws.send(JSON.stringify({ id: i, method, params })) })

  mkdirSync(OUT, { recursive: true })
  for (const icon of ICONS) {
    const expression = `(${drawIcon.toString()})(${JSON.stringify({ ...icon, grid: LOGO_GRID, colors: COLORS, background: BACKGROUND })})`
    const res = await send('Runtime.evaluate', { expression, returnByValue: true })
    const dataUrl = res.result?.result?.value
    if (!dataUrl) throw new Error(`No se pudo generar ${icon.file}: ${JSON.stringify(res.result)}`)
    writeFileSync(join(OUT, icon.file), Buffer.from(dataUrl.split(',')[1], 'base64'))
    console.log(`✓ ${icon.file} (${icon.size}x${icon.size})`)
  }
  ws.close()
} finally {
  chrome.kill()
}
process.exit(0)
