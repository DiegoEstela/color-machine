import { describe, expect, it } from 'vitest'
import { MENU_SECTIONS, menuItemFor } from './menuItems.js'
import { parseRoute } from './useRoute.js'

describe('MENU_SECTIONS', () => {
  const items = MENU_SECTIONS.flatMap((s) => s.items)
  it('los ids son únicos', () => {
    expect(new Set(items.map((i) => i.id)).size).toBe(items.length)
  })
  it('incluye Mis pinturas apuntando a su ruta', () => {
    const paints = items.find((i) => i.id === 'paints')
    expect(paints.href).toBe('#/pinturas')
    expect(parseRoute(paints.href).name).toBe('paints')
  })
  it('los ítems habilitados tienen enlace y los deshabilitados no navegan', () => {
    for (const item of items) {
      if (item.disabled) expect(item.href).toBeUndefined()
      else expect(item.href).toMatch(/^#\//)
    }
  })
})

describe('menuItemFor', () => {
  it('marca el ítem de cada ruta', () => {
    expect(menuItemFor({ name: 'paints' })).toBe('paints')
    expect(menuItemFor({ name: 'library' })).toBe('library')
    expect(menuItemFor({ name: 'recipe', id: 'a' })).toBe('library')
    expect(menuItemFor({ name: 'account' })).toBe('account')
    expect(menuItemFor({ name: 'create' })).toBeNull()
  })
})
