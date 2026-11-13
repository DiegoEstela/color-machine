import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BACKGROUND_COLOR, THEME_COLOR, isNetworkOnly, manifest, pwaOptions, workbox } from './pwaConfig.js'

const root = join(import.meta.dirname, '..', '..')

/** Ancho y alto de un PNG, leídos de su cabecera (IHDR). */
function pngSize(file) {
  const buf = readFileSync(file)
  expect(buf.subarray(1, 4).toString()).toBe('PNG')
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
}

describe('manifest', () => {
  it('declara los campos que exige la instalación', () => {
    expect(manifest).toMatchObject({
      name: 'Color Machine',
      short_name: expect.any(String),
      lang: 'es',
      start_url: '/',
      scope: '/',
      id: '/',
      display: 'standalone',
      orientation: 'portrait',
      theme_color: THEME_COLOR,
      background_color: BACKGROUND_COLOR,
    })
  })
  it('el nombre corto es breve (los lanzadores recortan los nombres largos bajo el ícono)', () => {
    expect(manifest.short_name.length).toBeLessThanOrEqual(15)
  })
  it('si no puede ser standalone, cae en minimal-ui y nunca en una pestaña de navegador', () => {
    expect(manifest.display_override).toEqual(['standalone', 'minimal-ui'])
  })
  it('incluye íconos de 192 y 512 px y uno maskable de 512', () => {
    const find = (sizes, purpose) => manifest.icons.find((i) => i.sizes === sizes && i.purpose === purpose)
    expect(find('192x192', 'any')).toBeDefined()
    expect(find('512x512', 'any')).toBeDefined()
    expect(find('512x512', 'maskable')).toBeDefined()
  })
  it('cada ícono existe y mide exactamente lo que declara', () => {
    for (const icon of manifest.icons) {
      const file = join(root, 'public', icon.src)
      expect(existsSync(file), icon.src).toBe(true)
      const [w, h] = icon.sizes.split('x').map(Number)
      expect(pngSize(file)).toEqual({ width: w, height: h })
    }
  })
  it('el ícono de iPhone mide 180x180 y el favicon 32x32', () => {
    expect(pngSize(join(root, 'public/icons/apple-touch-icon.png'))).toEqual({ width: 180, height: 180 })
    expect(pngSize(join(root, 'public/icons/favicon-32.png'))).toEqual({ width: 32, height: 32 })
  })
  it('los colores son hex válidos', () => {
    for (const c of [manifest.theme_color, manifest.background_color]) expect(c).toMatch(/^#[0-9a-f]{6}$/i)
  })
})

describe('service worker', () => {
  it('se registra a mano y no se activa en desarrollo', () => {
    expect(pwaOptions.injectRegister).toBe(false)
    expect(pwaOptions.devOptions.enabled).toBe(false)
  })
  it('precarga la app y abre /index.html al navegar sin red', () => {
    expect(workbox.navigateFallback).toBe('/index.html')
    expect(workbox.globPatterns.join()).toMatch(/js/)
    expect(workbox.globPatterns.join()).toMatch(/woff2/)
    expect(workbox.globPatterns.join()).toMatch(/png/)
  })
  it('las llamadas a Supabase (otro origen) van siempre a la red, nunca al caché', () => {
    const rule = workbox.runtimeCaching.find((r) => r.urlPattern === isNetworkOnly)
    expect(rule.handler).toBe('NetworkOnly')
    const supabase = new URL('https://villautpjwbddenbbhxy.supabase.co/rest/v1/paints')
    expect(isNetworkOnly({ url: supabase, sameOrigin: false })).toBe(true)
    expect(isNetworkOnly({ url: new URL('https://villautpjwbddenbbhxy.supabase.co/auth/v1/token'), sameOrigin: false })).toBe(true)
  })
  it('los archivos de la propia app sí pueden venir del caché', () => {
    expect(isNetworkOnly({ url: new URL('https://color-machine.vercel.app/assets/index.js'), sameOrigin: true })).toBe(false)
  })
  it('la regla de red-solo no usa variables externas (se copia tal cual al service worker)', () => {
    const src = isNetworkOnly.toString()
    expect(() => new Function(`return (${src})`)()({ sameOrigin: false })).not.toThrow()
  })
})
