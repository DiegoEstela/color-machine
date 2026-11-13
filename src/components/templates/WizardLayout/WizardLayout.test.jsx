import { render, screen } from '@testing-library/react'
import { WizardLayout } from '../index.js'

describe('WizardLayout', () => {
  it('muestra el paso, el título y el contenido', () => {
    render(<WizardLayout step={1} total={3} title="Elegí tu color"><p>contenido</p></WizardLayout>)
    expect(screen.getByText('Paso 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Elegí tu color' })).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'Paso 1 de 3' })).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByText('contenido')).toBeInTheDocument()
  })
})
