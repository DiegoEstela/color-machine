import { beforeEach, describe, expect, it, vi } from 'vitest'
import { INSTALL_TEXT, currentInstall, detectInstall } from './installHint.js'
import { hasSeen, markSeen, resetMemory, storageKey } from './onboardingStorage.js'
import { useOnboardingStore } from './onboardingStore.js'
import { CONTEXT, TOUR, helpScreenFor } from './steps.js'
import { buildTour, contextCard } from './tour.js'

beforeEach(() => {
  window.localStorage.clear()
  resetMemory()
  useOnboardingStore.getState().reset()
})

describe('contenido', () => {
  it('el recorrido tiene 8 tarjetas con título, ilustración y ids únicos', () => {
    expect(TOUR).toHaveLength(8)
    expect(new Set(TOUR.map((c) => c.id)).size).toBe(8)
    for (const card of TOUR) {
      expect(card.title.length).toBeGreaterThan(3)
      expect(card.art).toBeTruthy()
    }
  })
  it('cubre todas las funciones: consejo de colores, Ajustar, Editar mezcla, menú y Mis pinturas', () => {
    const text = TOUR.flatMap((c) => c.body).join(' ')
    for (const word of ['Para acercarte más', 'Ajustar', 'Editar mezcla', 'Mis pinturas', 'Recomendada', 'Más exacta', 'recorte', 'Crear']) {
      expect(text).toContain(word)
    }
  })
  it('hay ayuda para cada pantalla, con voseo y sin texto vacío', () => {
    for (const key of ['create-1', 'create-2', 'create-3', 'library', 'recipe', 'recipe-edit', 'paints', 'account']) {
      expect(CONTEXT[key].title).toBeTruthy()
      expect(CONTEXT[key].body.length).toBeGreaterThan(0)
    }
  })
})

describe('helpScreenFor', () => {
  it.each([
    [{ name: 'create' }, 1, 'create-1'],
    [{ name: 'create' }, 2, 'create-2'],
    [{ name: 'create' }, 3, 'create-3'],
    [{ name: 'create' }, 9, 'create-1'],
    [{ name: 'library' }, 1, 'library'],
    [{ name: 'recipe', id: 'a' }, 1, 'recipe'],
    [{ name: 'recipe-edit', id: 'a' }, 1, 'recipe-edit'],
    [{ name: 'paints' }, 1, 'paints'],
    [{ name: 'account' }, 1, 'account'],
  ])('%o paso %i → %s', (route, step, expected) => expect(helpScreenFor(route, step)).toBe(expected))
  it('toda pantalla devuelve una clave con contenido', () => {
    for (const route of [{ name: 'create' }, { name: 'library' }, { name: 'recipe' }, { name: 'recipe-edit' }, { name: 'paints' }, { name: 'account' }]) {
      for (const step of [1, 2, 3]) expect(CONTEXT[helpScreenFor(route, step)]).toBeTruthy()
    }
  })
})

describe('detectInstall', () => {
  it.each([
    [{ standalone: true }, 'installed'],
    [{ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)' }, 'ios'],
    [{ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 5 }, 'ios'], // iPad
    [{ userAgent: 'Mozilla/5.0 (Macintosh)', platform: 'MacIntel', maxTouchPoints: 0 }, 'other'],
    [{ userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8)' }, 'android'],
    [{}, 'other'],
  ])('%o → %s', (input, expected) => expect(detectInstall(input)).toBe(expected))

  it('currentInstall lee el navegador sin romper', () => {
    expect(['installed', 'ios', 'android', 'other']).toContain(currentInstall())
    const original = window.matchMedia
    window.matchMedia = () => { throw new Error('no') }
    expect(() => currentInstall()).not.toThrow()
    window.matchMedia = original
  })
})

describe('buildTour', () => {
  it('con la app instalada omite la tarjeta de instalar', () => {
    expect(buildTour('installed').map((c) => c.id)).not.toContain('install')
    expect(buildTour('installed')).toHaveLength(7)
  })
  it('la tarjeta de instalar lleva el texto de cada teléfono', () => {
    expect(buildTour('ios').at(-1).body).toEqual(INSTALL_TEXT.ios)
    expect(buildTour('android').at(-1).body.join(' ')).toMatch(/Instalar aplicación/)
    expect(buildTour('ios').at(-1).body.join(' ')).toMatch(/Compartir/)
    expect(buildTour('other').at(-1).body).toEqual(INSTALL_TEXT.other)
  })
  it('contextCard devuelve la ayuda de la pantalla o la de Crear si no se reconoce', () => {
    expect(contextCard('library').title).toBe('Tus recetas')
    expect(contextCard('nada').title).toBe('Elegí tu color')
  })
})

describe('onboardingStorage', () => {
  it('recuerda por usuario con clave versionada', () => {
    expect(hasSeen('u1')).toBe(false)
    markSeen('u1')
    expect(hasSeen('u1')).toBe(true)
    expect(hasSeen('u2')).toBe(false)
    expect(window.localStorage.getItem(storageKey('u1'))).toBe('1')
    expect(storageKey('u1')).toBe('cm.onboarding.v1.u1')
  })
  it('sin usuario no muestra nada', () => {
    expect(hasSeen(undefined)).toBe(true)
  })
  it('si localStorage falla, lo recuerda mientras la app está abierta y no rompe', () => {
    const get = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })
    expect(hasSeen('u9')).toBe(false)
    expect(() => markSeen('u9')).not.toThrow()
    expect(hasSeen('u9')).toBe(true)
    get.mockRestore()
    set.mockRestore()
  })
})

describe('onboardingStore', () => {
  const s = () => useOnboardingStore.getState()

  it('autoStart abre el recorrido la primera vez y no vuelve a hacerlo en la sesión', () => {
    s().autoStart('u1')
    expect(s()).toMatchObject({ open: true, mode: 'tour', index: 0 })
    s().close()
    s().autoStart('u1')
    expect(s().open).toBe(false)
  })
  it('autoStart no abre nada si ese usuario ya lo vio o no hay usuario', () => {
    markSeen('u1')
    s().autoStart('u1')
    expect(s().open).toBe(false)
    useOnboardingStore.getState().reset()
    s().autoStart(undefined)
    expect(s().open).toBe(false)
  })
  it('cerrar el recorrido (terminar, omitir o Atrás) lo marca como visto', () => {
    s().autoStart('u1')
    s().close()
    expect(hasSeen('u1')).toBe(true)
  })
  it('la ayuda de una pantalla no marca el recorrido como visto', () => {
    s().autoStart('u1') // userId queda guardado
    s().close()
    window.localStorage.clear()
    resetMemory()
    s().startContext('library')
    expect(s()).toMatchObject({ open: true, mode: 'context', screen: 'library' })
    s().close()
    expect(hasSeen('u1')).toBe(false)
  })
  it('desde la ayuda se pasa al recorrido completo, desde el principio', () => {
    s().startContext('paints')
    s().showTour()
    expect(s()).toMatchObject({ mode: 'tour', index: 0 })
  })
  it('goTo se queda dentro de las tarjetas', () => {
    s().startTour()
    s().goTo(99, 8)
    expect(s().index).toBe(7)
    s().goTo(-3, 8)
    expect(s().index).toBe(0)
  })
  it('reset permite que el próximo usuario lo vea', () => {
    markSeen('u1')
    s().autoStart('u1')
    s().reset()
    s().autoStart('u2')
    expect(s().open).toBe(true)
  })
})
