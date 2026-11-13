import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePaintsStore } from '../../features/paints/paintsStore.js'
import Paints from './Paints.jsx'

beforeEach(() => {
  usePaintsStore.setState({
    paints: [{ id: 'p1', name: 'Rojo cadmio', hex: '#e4002b' }],
    selectedIds: [], thumbs: {}, status: 'ready', error: null, load: vi.fn(),
  })
})

describe('Paints', () => {
  it('lista las pinturas sin casillas de selección y con Agregar pintura', () => {
    render(<Paints />)
    expect(screen.getByRole('heading', { name: 'Mis pinturas' })).toBeInTheDocument()
    expect(screen.getByText('Rojo cadmio')).toBeInTheDocument()
    expect(screen.queryByRole('button', { pressed: false })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Agregar pintura/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  })
  it('no marca ninguna pestaña como activa', () => {
    render(<Paints />)
    expect(screen.getByRole('navigation', { name: 'Navegación principal' }).querySelector('[aria-current]')).toBeNull()
  })
})
