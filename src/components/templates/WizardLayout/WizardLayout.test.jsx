import { render, screen, fireEvent } from '@testing-library/react'
import { WizardLayout } from '../index.js'

describe('WizardLayout', () => {
  it('muestra el título, el contenido y el paso actual', () => {
    render(<WizardLayout step={1} total={3} title="Elegí tu color"><p>contenido</p></WizardLayout>)
    expect(screen.getByRole('heading', { name: 'Elegí tu color' })).toBeInTheDocument()
    expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'Paso 1 de 3' })).toBeInTheDocument()
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })

  it('la barra de título lleva el logo y el título; el indicador de pasos va dentro de la ventana', () => {
    const { container } = render(<WizardLayout step={2} total={3} title="Tus pinturas">x</WizardLayout>)
    const titlebar = screen.getByRole('heading', { name: 'Tus pinturas' }).closest('[class*="titlebar"]')
    expect(titlebar.querySelector('svg')).not.toBeNull() // logo
    expect(container.querySelector('ol')).not.toBeNull()
    expect(screen.getByRole('listitem', { current: 'step' })).toHaveTextContent('Pinturas')
  })

  it('muestra un botón de ícono para cerrar sesión solo si hay onSignOut', () => {
    const onSignOut = vi.fn()
    const { rerender } = render(<WizardLayout step={1} total={3} title="Paso" onSignOut={onSignOut}>x</WizardLayout>)
    const btn = screen.getByRole('button', { name: 'Cerrar sesión' })
    expect(btn).not.toHaveTextContent(/\S/) // solo ícono, sin texto
    fireEvent.click(btn)
    expect(onSignOut).toHaveBeenCalledTimes(1)
    rerender(<WizardLayout step={1} total={3} title="Paso">x</WizardLayout>)
    expect(screen.queryByRole('button', { name: 'Cerrar sesión' })).not.toBeInTheDocument()
  })
})
