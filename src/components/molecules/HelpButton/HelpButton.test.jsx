import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HelpButton } from '../index.js'

describe('HelpButton', () => {
  it('es un botón con nombre accesible "Ayuda" y un ícono decorativo', () => {
    const { container } = render(<HelpButton onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Ayuda' })).toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
  it('avisa al tocarlo', () => {
    const onClick = vi.fn()
    render(<HelpButton onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Ayuda' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })
  it('se ve de 34 px (la zona táctil de 44 px la pone el botón de ícono)', () => {
    render(<HelpButton onClick={() => {}} />)
    expect(screen.getByRole('button', { name: 'Ayuda' }).style.getPropertyValue('--visual')).toBe('34px')
  })
})
