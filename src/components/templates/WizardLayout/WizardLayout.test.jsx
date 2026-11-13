import { render, screen, fireEvent } from '@testing-library/react'
import { WizardLayout } from '../index.js'

describe('WizardLayout', () => {
  it('muestra el paso, el título y el contenido', () => {
    render(<WizardLayout step={1} total={3} title="Elegí tu color"><p>contenido</p></WizardLayout>)
    expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Elegí tu color' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Paso 1 de 3' })).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByText('contenido')).toBeInTheDocument()
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

  it('el título comparte cabecera con el indicador compacto', () => {
    render(<WizardLayout step={2} total={3} title="Tus pinturas">x</WizardLayout>)
    expect(screen.getByText('2/3')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Paso 2 de 3' })).toHaveAttribute('data-size', 'sm')
  })
})
