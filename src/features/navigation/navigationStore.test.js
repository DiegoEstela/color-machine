import { beforeEach, describe, expect, it } from 'vitest'
import { useNavigationStore } from './navigationStore.js'

beforeEach(() => useNavigationStore.setState({ drawerOpen: false }))

describe('navigationStore', () => {
  it('abre y cierra el menú lateral', () => {
    expect(useNavigationStore.getState().drawerOpen).toBe(false)
    useNavigationStore.getState().openDrawer()
    expect(useNavigationStore.getState().drawerOpen).toBe(true)
    useNavigationStore.getState().closeDrawer()
    expect(useNavigationStore.getState().drawerOpen).toBe(false)
  })
})
